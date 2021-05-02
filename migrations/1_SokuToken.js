const SokuToken = artifacts.require("SokuToken");

module.exports = function(deployer) {
    deployer.then(function() {
        return deployer.deploy(SokuToken).then(soku => {
            console.log("SokuToken is deployed at ", soku.address);
        })
    });
}