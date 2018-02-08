pragma solidity ^0.4.18;

import "./MainframeToken.sol";

contract MainframeStake {
  mapping (address => uint256) public balances;
  MainframeToken token;

  function MainframeStake(address _addr) public {
    token = MainframeToken(_addr);
  }

  function deposit(uint256 _value) public returns (bool success) {
    token.transferFrom(msg.sender, address(this), _value);
    balances[msg.sender] += _value;
    Deposit(msg.sender, _value, balances[msg.sender]);
    return true;
  }

  function withdraw(uint256 _value) public returns (bool success) {
    require(balances[msg.sender] >= _value);
    token.transfer(msg.sender, _value);
    balances[msg.sender] -= _value;
    Withdrawal(msg.sender, _value, balances[msg.sender]);
    return true;
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  event Deposit(address indexed _owner, uint256 _value, uint256 _balance);
  event Withdrawal(address indexed _owner, uint256 _value, uint256 _balance);
}
