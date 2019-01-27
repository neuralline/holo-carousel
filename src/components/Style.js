 const Style = (_c, type =0) =>{
if(type){
    _c.package.style.transitionDuration = '0ms';
    _c.package.style.transitionTimingFunction = "linear";
}
else {
    _c.package.style.transitionDuration = this._e.duration + 's';
    _c.package.style.transitionTimingFunction = "linear";
}
}

 export default Style