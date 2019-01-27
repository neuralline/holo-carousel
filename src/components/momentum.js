console.clear();

function AnimationLoop() {

    var animations = [],
        animating = true,
        frame;

    function animate() {
        if (frame) { return; }
        if (animating) { frame = requestAnimationFrame(animate); }
        var i = animations.length;
        while (i--) {
            if (!animations[i] || animations[i]() === false) { animations.splice(i, 1); }
        }
        frame = null;
    };

    function add() {
        animations.push.apply(animations, arguments);
    };

    add.apply(null, arguments);
    animate();

    return {
        animations: animations,
        add: add,
        stop: function () { animating = false; },
        start: function () { animating = true; animate(); }
    };
}

var loop = AnimationLoop();


function Drag() {



}

var drag = {

    x: 0,
    y: 0,

    decVelX: 0,
    decVelY: 0,
    friction: 0.95,

    el: null,

    dragging: false,

    bounds: {
        x: document.body.clientWidth,
        y: document.body.clientHeight
    },

    positions: [],
    getPosition(e) {
        if (e) { e.preventDefault(); }
        var event = (e ? e.touches ? e.touches[0] : e : {}),
            pos = { x: event.pageX, y: event.pageY, time: Date.now() };

        this.positions.push(pos);

        return pos;
    },

    move(e) {
        if (this.dragging) {
            var pos = this.getPosition(e);
            this.x = pos.x - this.offsetX;
            this.y = pos.y - this.offsetY;
        }
    },

    start(e) {
        this.positions = [];
        this.dragging = true;
        this.decelerating = false;

        var pos = this.getPosition(e);
        this.startX = pos.x;
        this.startY = pos.y;

        var rect = this.el.getBoundingClientRect();
        this.offsetX = this.startX - rect.left;
        this.offsetY = this.startY - rect.top;

        this.x = pos.x - this.offsetX;
        this.y = pos.y - this.offsetY;

        this.moveTime = this.startTime = Date.now();

        loop.add(this.update.bind(this));
    },

    end(e) {
        if (this.dragging) {
            this.dragging = false;
            var pos = this.getPosition(e);
            var now = Date.now();
            var lastPos = this.positions.pop();
            var i = this.positions.length;

            while (i--) {
                if (now - this.positions[i].time > 150) { break; }
                lastPos = this.positions[i];
            }

            var xOffset = pos.x - lastPos.x;
            var yOffset = pos.y - lastPos.y;

            var timeOffset = (Date.now() - lastPos.time) / 12;

            this.decelX = (xOffset / timeOffset) || 0;
            this.decelY = (yOffset / timeOffset) || 0;
            this.decelerating = true;
        }

    },

    update() {
        if (this.el) {

            if (this.decelerating) {
                this.decelX *= this.friction;
                this.decelY *= this.friction;

                this.x += this.decelX;
                this.y += this.decelY;

                if (Math.abs(this.decelX) < 0.01) { this.decelX = 0; }
                if (Math.abs(this.decelY) < 0.01) { this.decelY = 0; }
                if (this.decelX === 0 && this.decelY === 0) {
                    this.decelerating = false;
                    return false;
                }
            }

            this.x = Math.max(0, Math.min(this.bounds.x, this.x));
            this.y = Math.max(0, Math.min(this.bounds.y, this.y));

            this.onUpdate(this.x, this.y);
        }
    },

    onUpdate(x, y) {
        this.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    },

    register(el) {

        this.el = el || this.el;

        if (this.el) {
            this.start();
            this.el.addEventListener('mousedown', this.start.bind(this));
            document.addEventListener('mousemove', this.move.bind(this));
            document.addEventListener('mouseup', this.end.bind(this));
            this.end();
        }
    }
};

drag.register(document.getElementById('drag'));

