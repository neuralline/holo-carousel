/** @format */

import {_holo} from './holo-essentials'
import holoCreateElement from './holo-create-element'

//holo Locate all holo carousel structures ByClassName
const holoInitiate = carouselClassName => {
  const carousels = document.getElementsByClassName(carouselClassName) //get all carousels by this class name
  if (carousels.length) {
    for (let slide of carousels) {
      //for each carousel found
      holoCreateElement(slide)
    }
  } else {
    return console.log('@Holo : Holo carousel structure not found')
  }
}
export default holoInitiate
