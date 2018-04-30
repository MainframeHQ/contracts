pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MainframeTokenDistribution is Ownable {

  uint public totalDistributed;
  ERC20 mainframeToken;

  event TokensDistributed(address receiver, uint amount);

  function MainframeTokenDistribution(address tokenAddress) public {
    mainframeToken = ERC20(tokenAddress);
  }

  function validate(address tokenOwner, address[] recipients, uint[] values) public view returns (bool) {
    require(recipients.length == values.length);
    uint totalDistributionAmount = 0;
    for(uint i = 0; i < recipients.length; i++) {
      totalDistributionAmount += values[i];
    }
    return mainframeToken.balanceOf(tokenOwner) >= totalDistributionAmount &&
      mainframeToken.allowance(tokenOwner, this) >= totalDistributionAmount;
  }

  function distributeTokens(address tokenOwner, address[] recipients, uint[] values) onlyOwner external {
    require(validate(tokenOwner, recipients, values));
    for(uint i = 0; i < recipients.length; i++) {
      if(values[i] > 0) {
        require(mainframeToken.transferFrom(tokenOwner, recipients[i], values[i]));
        emit TokensDistributed(recipients[i], values[i]);
        totalDistributed += values[i];
      }
    }
  }

  function emergencyERC20Drain(ERC20 token) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    uint256 amount = token.balanceOf(this);
    token.transfer(owner, amount);
  }
}
