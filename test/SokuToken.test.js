const { assert } = require("chai");

const SokuToken = artifacts.require('SokuToken');

contract('SokuToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.soku = await SokuToken.new({ from: minter });
    });


    it('mint', async () => {
        await this.soku.mint(alice, 1000, { from: minter });
        assert.equal((await this.soku.balanceOf(alice)).toString(), '1000');
    })
});
