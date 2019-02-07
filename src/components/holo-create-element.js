/** @format */

import {cyre} from 'cyre'
import Aure from './Aure'
import {_holo, ioData} from './holo-essentials'
import holoCreateCarousel from './holo-create-carousel'

const holoCreateElement = (slide, io = {}) => {
  console.log('holo carousel @init : found ---  ', slide.id)
  _holo[slide.id] = new Aure(slide, io) //register found carousels
  const holoState = _holo[slide.id].getState
  console.log('holo state : ', holoState)
  holoCreateCarousel(holoState, io)
}
export default holoCreateElement
