import TokenRinkeby from "./deployments/rinkeby/WaratahToken.json";
import TokenLocal from "./deployments/localhost/WaratahToken.json";

export const Token = {
  address: {
    rinkeby: TokenRinkeby.address,
    localhost: TokenLocal.address,
  },
  abi: {
    rinkeby: TokenRinkeby.abi,
    localhost: TokenLocal.abi,
  }
};
