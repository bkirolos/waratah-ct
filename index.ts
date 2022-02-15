import FlyingFormationsRinkeby from "./deployments/rinkeby/FlyingFormations.json";
import FlyingFormationsLocal from "./deployments/localhost/FlyingFormations.json";
import { FlyingFormations__factory } from "./typechain-types/factories/FlyingFormations__factory";

export const Knots = {
  address: {
    rinkeby: FlyingFormationsRinkeby.address,
    localhost: FlyingFormationsLocal.address,
  },
  factory: FlyingFormations__factory,
};
