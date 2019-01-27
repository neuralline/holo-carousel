import { cyre } from 'cyre';
import Touch from './holo-touch';
import { _holo } from './events';
import holoCreateElement from './holo-create-element'



//holo Locate all holo carousel structures ByClassName
export const holoInitiate = (au) => {
    const carousels = document.getElementsByClassName(au); //get all carousels by this class name
    if (carousels.length) {
        for (let slide of carousels) { //for each carousel found
            holoCreateElement(slide)
        }
    } else {
        return console.log('@Holo : Holo carousel structure not found');
    }
}
export default holoInitiate