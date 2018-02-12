pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MainframeToken is PausableToken {
    string  public  constant name = "Mainframe Token";
    string  public  constant symbol = "MFT";
    uint8   public  constant decimals = 8;

    modifier validDestination( address to )
    {
        require(to != address(0x0));
        require(to != address(this));
        _;
    }

    function MainframeToken()
    {
        // assign the total tokens to mainframe
        totalSupply_ = 1000000000000000000; // 10 billion, 8 decimals
        balances[msg.sender] = totalSupply_;
        Transfer(address(0x0), msg.sender, totalSupply_);
    }

    function transfer(address _to, uint _value) validDestination(_to) returns (bool)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) validDestination(_to) returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    event Burn(address indexed _burner, uint _value);

    function burn(uint _value) returns (bool)
    {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply_ = totalSupply_.sub(_value);
        Burn(msg.sender, _value);
        Transfer(msg.sender, address(0x0), _value);
        return true;
    }

    // save some gas by making only one contract call
    function burnFrom(address _from, uint256 _value) returns (bool)
    {
        assert( transferFrom( _from, msg.sender, _value ) );
        return burn(_value);
    }

    function emergencyERC20Drain( ERC20 token, uint amount ) onlyOwner {
        // owner can drain tokens that are sent here by mistake
        token.transfer( owner, amount );
    }
}
