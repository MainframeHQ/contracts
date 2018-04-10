pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MainframeTokenDistribution is Ownable {

  uint public totalDistributed;
  ERC20 token;

  event TokensDistributed(address receiver, uint amount);

  function MainframeTokenDistribution(address tokenAddress) public {
    token = ERC20(tokenAddress);
  }

  function validate(address tokenOwner, address[] recipients, uint[] values) public view returns (bool) {
    require(recipients.length == values.length);
    uint totalDistributionAmount = 0;
    for(uint i = 0; i < recipients.length; i++) {
      totalDistributionAmount += values[i];
    }
    return token.balanceOf(tokenOwner) >= totalDistributionAmount &&
      token.allowance(tokenOwner, this) >= totalDistributionAmount;
  }

  function distributeTokens(address tokenOwner, address[] recipients, uint[] values) onlyOwner external {
    require(validate(tokenOwner, recipients, values));
    for(uint i = 0; i < recipients.length; i++) {
      if(values[i] > 0) {
        require(token.transferFrom(tokenOwner, recipients[i], values[i]));
        TokensDistributed(recipients[i], values[i]);
        totalDistributed += values[i];
      }
    }
  }
}
