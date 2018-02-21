pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract MainframeToken {
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function transfer(address to, uint256 value) public returns (bool);
  function balanceOf(address who) public view returns (uint256);
}

contract MainframeEscrow is Ownable {
  address public stakingAddress;
  mapping (address => uint256) public balances;
  MainframeToken token;

  function MainframeEscrow(address _tokenAddress) public {
    token = MainframeToken(_tokenAddress);
    owner = msg.sender;
    stakingAddress = msg.sender;
  }

  function deposit(address _address, uint256 _value) public onlyStakingAddress returns (bool success) {
    token.transferFrom(_address, this, _value);
    balances[_address] += _value;
    return true;
  }

  function withdraw(address _address, uint256 _value) public onlyStakingAddress returns (bool success) {
    require(balances[_address] >= _value);
    token.transfer(_address, _value);
    balances[_address] -= _value;
    return true;
  }

  function balanceOf(address _address) public view returns (uint256 balance) {
    return balances[_address];
  }

  function totalBalance() public view returns (uint256) {
    return token.balanceOf(this);
  }

  modifier onlyStakingAddress() {
    require(msg.sender == stakingAddress);
    _;
  }

  function changeStakingAddress(address newStakingAddress) public onlyOwner {
    require(newStakingAddress != address(0));
    StakingAddressChanged(stakingAddress, newStakingAddress);
    stakingAddress = newStakingAddress;
  }

  event StakingAddressChanged(address indexed previousStakingAddress, address indexed newStakingAddress);
}
