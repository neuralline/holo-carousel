/** @format */
//@ts-check

import Aure from './core/Aure'
import {_holo} from './holo-essentials'
import ManageIO from './holo-io-manager'
/**
@param{object} slide single element of halo
@param{object} io holo input output parameters/options
*/
const holoCreateElement = (slide, io) => {
  _holo[slide.id] = new Aure(slide, io) //register found carousels

  ManageIO(_holo[slide.id].getVirtual, _holo[slide.id].getShadow)
}
export default holoCreateElement
