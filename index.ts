import KnotsRinkeby from "./deployments/rinkeby/Knots.json";
import KnotsLocal from "./deployments/localhost/Knots.json";
import { Knots__factory } from "./typechain-types/factories/Knots__factory";

export const Knots = {
  address: {
    rinkeby: KnotsRinkeby.address,
    localhost: KnotsLocal.address,
  },
  factory: Knots__factory,
};
