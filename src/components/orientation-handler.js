import { _holo, _snap } from "./holo-essentials";

export const _transformX = (_e) => {
    _e.transformX = _e.io.snap && _snap(_e.transformX, _e.item.width) || _e.transformX;
    _e.transformY = 0;
    if (_e.transformX >= 0) {
        _e.transformX = 0;
        _e.sliderEnd = 1; //Left EnD of the carousel
    } else if (_e.transformX <= _e.endNumber) {
        _e.transformX = _e.endNumber;
        _e.sliderEnd = -1; //Right end of the carousel
    } else {
        _e.sliderEnd = 0; //in the middle carousel
    }
    return _e
};

export const _transformY = (_e) => {
    _e.transformY = _e.io.snap && _snap(_e.transformY, _e.item.height) || _e.transformY;
    _e.transformX = 0;
    if (_e.transformY >= 0) {
        _e.transformY = 0;
        _e.sliderEnd = 1; //Left EnD of the carousel
    } else if (_e.transformY <= _e.endNumber) {
        _e.transformY = _e.endNumber;
        _e.sliderEnd = -1; //Right end of the carousel
    } else {
        _e.sliderEnd = 0; //in the middle carousel
    }
    return _e
};