import TokenRinkeby from "./deployments/rinkeby/FlyingFormations.json";
import TokenLocal from "./deployments/localhost/FlyingFormations.json";
import TokenMainnet from "./deployments/mainnet/FlyingFormations.json";

export const Token = {
  address: {
    rinkeby: TokenRinkeby.address,
    localhost: TokenLocal.address,
    homestead: TokenMainnet.address,
  },
  abi: {
    rinkeby: TokenRinkeby.abi,
    localhost: TokenLocal.abi,
    homestead: TokenMainnet.abi,
  },
};
