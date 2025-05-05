/** @format */

//src/components/
const _controller = _e => {
  //manages package

  if (!_e.id) {
    return console.log('Holo controller error')
  }

  const carousel = document.getElementsByClassName('holo-controller') //get all carousels
  if (!carousel.length) {
    console.log('@Holo : no controller found')

    return 0
  }

  for (let slide of carousel) {
    console.log('@dataset : ', slide.dataset.holo) //for each carousel found
  }

  const slides = Math.ceil(_e.package.width / _e.carousel.width)

  console.log('@holo id - -------------------------')
  console.log('@holo id - ', _e.id, slides)
  console.log('@holo _e.numberOfSlots - ', _e.numberOfSlots)
  console.log('@holo x/width - ', _e.transformX / _e.carousel.width)
  console.log('@transformX - ', _e.transformX, _e.transformY)
  console.log('@carousel.width - ', _e.carousel.width)
  console.log('@package.width - ', _e.package.width)
  // return _transform(_e.id, _e.transformX, _e.transformY); //call for dom access
}
export default _controller
