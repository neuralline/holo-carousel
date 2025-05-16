//src/components/create-holo-element.ts

import Aure from '../core/Aure'
import {_holo} from './holo-essentials'
import ManageIO from './holo-io-manager'
/**
@param{slide} slide single element of halo
@param{io} io holo input output parameters/options
*/
const holoCreateElement = (slide, io) => {
  //create a single element of holo
  _holo[slide.id] = new Aure(slide, io) //register found carousels

  ManageIO(_holo[slide.id].getVirtual, _holo[slide.id].getShadow)
}
export default holoCreateElement
