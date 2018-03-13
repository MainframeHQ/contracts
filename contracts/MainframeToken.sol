pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MainframeToken is PausableToken {
  string public constant name = "Mainframe Token";
  string public constant symbol = "MFT";
  uint8  public constant decimals = 18;

  modifier validDestination(address to) {
    require(to != address(0x0));
    require(to != address(this));
    _;
  }

  function MainframeToken() public {
    // assign the total tokens to mainframe
    totalSupply_ = 10000000000 ether; // 10 billion, 18 decimals (ether = 10^18)
    balances[msg.sender] = totalSupply_;
    Transfer(address(0x0), msg.sender, totalSupply_);
  }

  function transfer(address to, uint value) public validDestination(to) returns (bool) {
    return super.transfer(to, value);
  }

  function transferFrom(address from, address to, uint value) public validDestination(to) returns (bool) {
    return super.transferFrom(from, to, value);
  }

  function emergencyERC20Drain(ERC20 token, uint amount) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    token.transfer(owner, amount);
  }
}
