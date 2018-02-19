pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MainframeToken is PausableToken {
    string  public  constant name = "Mainframe Token";
    string  public  constant symbol = "MFT";
    uint8   public  constant decimals = 18;

    modifier validDestination( address to )
    {
        require(to != address(0x0));
        require(to != address(this));
        _;
    }

    function MainframeToken() public
    {
        // assign the total tokens to mainframe
        totalSupply_ = 10000000000 * 10**18; // 10 billion, 18 decimals
        balances[msg.sender] = totalSupply_;
        Transfer(address(0x0), msg.sender, totalSupply_);
    }

    function transfer(address _to, uint _value) public validDestination(_to) returns (bool)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public validDestination(_to) returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    function emergencyERC20Drain( ERC20 token, uint amount ) public onlyOwner {
        // owner can drain tokens that are sent here by mistake
        token.transfer( owner, amount );
    }
}
