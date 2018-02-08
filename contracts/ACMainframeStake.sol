pragma solidity ^0.4.11;

contract ERC20Token {
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);
  function transfer(address to, uint256 value) public returns (bool);
}

contract ACMainframeStake {
  address public owner;
  ERC20Token tokenContract;

  uint numberOfStakers;
  uint minimumStake;
  uint public totalStaked;

  mapping(address => uint256) stakerInfo;

  function ACMainframeStake(address _tokenContractAddress) public {
    owner = msg.sender;
    minimumStake = 100;
    tokenContract = ERC20Token(_tokenContractAddress);
  }

  function kill() public {
    if(msg.sender == owner)
      selfdestruct(owner);
  }

  function stakeTokens(uint256 tokens) public returns (uint256) {
    require(tokenContract.transferFrom(msg.sender, this, tokens));
    stakerInfo[msg.sender] += tokens;
    totalStaked += tokens;
    return 300;
  }

  function receiveApproval(address _sender, uint256 _value, ERC20Token _tokenContract, bytes _extraData) public {
    require(_tokenContract == tokenContract);
    require(_tokenContract.transferFrom(_sender, address(this), _value));
    stakerInfo[msg.sender] += _value;
    totalStaked += _value;
  }

  function withdrawStake(uint256 tokens) public {
    require(msg.sender != address(0));
    require(tokens <= stakerInfo[msg.sender]);
    tokenContract.transfer(msg.sender, tokens);
    stakerInfo[msg.sender] -= tokens;
    totalStaked -= tokens;
  }

  function totalStaked() public view returns (uint) {
    return totalStaked;
  }

  function amountStaked(address _address) public view returns (uint256 balance) {
    return stakerInfo[_address];
  }

}
