const SokuToken = artifacts.require("SokuToken");    
const SokuCrowdSale = artifacts.require("SokuCrowdSale");

module.exports = function(deployer) {
    const tokenAddr = await SokuToken.deployed();
    deployer.then(function() {
        return deployer.deploy(SokuCrowdSale, '12000', deployer.address, tokenAddr, '50000000000000000000', '833330000000000000000').then(sokucrowdsale => {
            console.log("SokuCrowdSale is deployed at ", sokucrowdsale.address);
        })
    });
    
}