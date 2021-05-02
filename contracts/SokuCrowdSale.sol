pragma solidity ^0.6.12;

import "@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol";
import "./crowdsale/Crowdsale.sol";
import "./crowdsale/RefundVault.sol";


contract SokuCrowdsale is Crowdsale, Ownable {
    using SafeMath for uint256;

    uint256 public investorMinCap = 160000000000000000; // 0.16BNB
    uint256 public investorHardCap = 100000000000000000000;  // 100BNB

    uint256 public cap;

    // minimum amount of funds to be raised in weis
    uint256 public goal;
    // refund vault used to hold funds while crowdsale is running
    RefundVault public vault;

    bool public isFinalized = false;

    mapping(address => uint256) public contributions;

    event Finalized();

    /**
     * @dev Constructor, creates RefundVault.
     * @param _goal Funding goal
     */
    constructor(
        uint256 _rate,            // rate, in Sokubits   12520 for $0.05 token price
        address payable _wallet,  // wallet to send BNB
        BEP20 _token,            // the token
        uint256 _goal,           // the minimum goal, in wei   48e18 for $30,000
        uint256 _cap             // // total cap, in wei     800e18 for $500,000
    )
        Crowdsale(_rate, _wallet, _token)
        public
    {
        // nice! this crowdsale will, if it doesn't hit `goal`, allow everyone to get their money back
        // by calling claimRefund(...)
        cap = _cap;

        require(_goal > 0);
        vault = new RefundVault(wallet);
        goal = _goal;
    }

    /**
     * @dev Checks whether the cap has been reached.
     * @return Whether the cap was reached
     */
    function capReached() public view returns (bool) {
        return weiRaised >= cap;
    }

    /**
     * @dev Checks the amount of tokens left in the allowance.
     * @return Amount of tokens left in the allowance
     */
    function remainingTokens() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev Investors can claim refunds here if crowdsale is unsuccessful
     */
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());

        vault.refund(msg.sender);
    }

    /**
     * @dev Checks whether funding goal was reached.
     * @return Whether funding goal was reached
     */
    function goalReached() public view returns (bool) {
        return weiRaised >= goal;
    }

    /**
     * @dev Must be called after crowdsale ends, to do some extra finalization
     * work. Calls the contract's finalization function.
     */
    function finalize() onlyOwner public {
        require(!isFinalized);

        finalization();
        emit Finalized();

        isFinalized = true;
    }

    /**
     * @dev Can be overridden to add finalization logic. The overriding function
     * should call super.finalization() to ensure the chain of finalization is
     * executed entirely.
     */
    function finalization() internal {
        if (goalReached()) {
            vault.close();
        } else {
            vault.enableRefunds();
        }
    }

    /**
     * @dev Extend parent behavior requiring purchase to respect the funding cap.
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    )
        internal
        override
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(weiRaised.add(_weiAmount) <= cap);
    
        uint256 _existingContribution = contributions[_beneficiary];
        
        uint256 _newContribution = _existingContribution.add(_weiAmount);
        require(_newContribution >= investorMinCap && _newContribution <= investorHardCap);
        contributions[_beneficiary] = _newContribution;
    }

    /**
     * @dev Overrides Crowdsale fund forwarding, sending funds to vault.
     */
    function _forwardFunds() override internal {
        vault.deposit{value: msg.value}(msg.sender);
    }
}
