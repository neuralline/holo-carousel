export const _width = (_e) => { //manages carousel(not pure)
    if (!_e.id) { return console.log('Holo width error') }
    _e._state.carousel.width = _holo[_e.id].carousel.clientWidth || 0;
    _e.endNumber = -Math.abs(_e.package.width - _e.carousel.width)
    _e.package.height = _holo[_e.id].package.height || 0;
    return _holo[_e.id]._setState()/* , _snapWidth(_e); */
}


const dataDefinitions = {
    width: (_e) => {
        const { height, width } = _getItemWidthHeight(_holo[_e.id].package.children[0]);
        _e.item.height = height;
        _e.item.width = width;
        _e.numberOfSlots = _numberOfSlots(_holo[_e.id].carousel.parentNode.clientWidth, _e.item.width, _e.item.max) || 1;
        _e.carousel.width = _e.numberOfSlots * _e.item.width;
        // _e.carousel.height = _holo[_e.id].carousel.height || _e.item.width;
        _e.package.width = _e.io.orientation ? _e.carousel.width : _holo[_e.id].package.children.length * _e.item.width;
        _e.endNumber = -Math.abs(_e.package.width - _e.carousel.width)
        _e.package.height = _holo[_e.id].package.height || 0;
        return _holo[_e.id]._setState()/* , _snapWidth(_e); */

    }
}
/* io = {
    enabled: 1,
    wheel: (id) => { _holo[id].carousel.addEventListener('wheel', _wheeler) },
    animate: (id) => { cyre.respond('TIME' + id, "TIME", id, 1000, 5000) },
    drag: (id) => {
        _holo[id].carousel.addEventListener(_Touch.touch.start, (
            (e) => {
                _Touch._touchStart(e, id)
            })
        );
    },
    snap: 0,
    focus: 0,
    orientation: 0,
    type: true
}; */