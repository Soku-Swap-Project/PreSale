const { expect } = require('chai');
const truffleAssert = require('truffle-assertions');
const BigNumber = web3.utils.BN;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Crowdsale = artifacts.require('SokuCrowdsale');
const SokuToken = artifacts.require('SokuToken');

function ether (n) {
    return new BigNumber(web3.utils.toWei(n, 'ether'));
}

contract('Crowdsale', function ([_, investor, wallet, purchaser]) {
    const rate = new BigNumber('10');
    const tokenSupply = new BigNumber('100000000000000000000'); //1e20

    let token, crowdsale;

    
    beforeEach(async function () {
        token = await SokuToken.new();
        crowdsale = await Crowdsale.new(rate, wallet, token.address, ether('10'), ether('100'));
        await token.mint(crowdsale.address, tokenSupply);
    });

    describe('CappedCrowdsale', () => {
        it('should not buy tokens with the amount less than mincap', async () => {
            await truffleAssert.reverts(crowdsale.buyTokens(investor, {value: ether('0.15') , from: investor}));
        })

        it('should buy tokens', async () => {
            let fundOrg = await web3.eth.getBalance(wallet);
            await crowdsale.buyTokens(investor, {value: '200000000000000000' , from: investor});   //0.2e18
            let crowdsaleBalance = await token.balanceOf(crowdsale.address);
            expect(crowdsaleBalance.eq(new BigNumber('98000000000000000000'))).to.be.true;
            let invesetorBalance = await token.balanceOf(investor);
            expect(invesetorBalance.eq(new BigNumber('2000000000000000000'))).to.be.true;

            await crowdsale.buyTokens(investor, {value: '4800000000000000000' , from: investor});   //4.8e18
            crowdsaleBalance = await token.balanceOf(crowdsale.address);
            expect(crowdsaleBalance.eq(new BigNumber('50000000000000000000'))).to.be.true;
            invesetorBalance = await token.balanceOf(investor);
            expect(invesetorBalance.eq(new BigNumber('50000000000000000000'))).to.be.true;
        })

        it('should buy tokens', async () => {
            let fundOld = await web3.eth.getBalance(wallet);
            await crowdsale.buyTokens(investor, {value: '10000000000000000000' , from: investor});   //1e19
            crowdsaleBalance = await token.balanceOf(crowdsale.address);
            let fundNew = await web3.eth.getBalance(wallet);
            expect(crowdsaleBalance.eq(new BigNumber('0'))).to.be.true;
            let invesetorBalance = await token.balanceOf(investor);
            expect(invesetorBalance.eq(new BigNumber('100000000000000000000'))).to.be.true;
        })
    });

    describe('RefundableCrowdsale', () => {
        it('should not refund if the goal is reached', async () => {
            await crowdsale.buyTokens(investor, {value: '10000000000000000000' , from: investor});   //1e19
            await crowdsale.finalize();
            await truffleAssert.reverts(crowdsale.claimRefund({from: investor}));
        })

        it('should refund if the owner doesn not call finalize() function', async () => {
            await crowdsale.buyTokens(investor, {value: '9000000000000000000' , from: investor});   //9e18
            await truffleAssert.reverts(crowdsale.claimRefund({from: investor}));
        })

        it('should refund if the goal is not reached', async () => {
            await crowdsale.buyTokens(investor, {value: '9000000000000000000' , from: investor});   //9e18
            let investorBalanceOld = await web3.eth.getBalance(investor);
            await crowdsale.finalize();
            await crowdsale.claimRefund({from: investor});
            let investorBalanceNew = await web3.eth.getBalance(investor);
            expect(Number(investorBalanceNew)).to.be.gt(Number(investorBalanceOld));
        })
    });
});
