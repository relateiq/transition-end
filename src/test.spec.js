describe('transition-end', function () {
    var transitionEnd = require('./');

    beforeEach(function () {
        createElement.call(this);
        this.endCallback = jasmine.createSpy('transitionEndCallback');
    });

    it('should call the transitionEndCallback by falling back to default transition property', function (done) {
        testTransitionEndCallback.call(this, done, '', '', 'left');
    });

    it('should call the transitionEndCallback with default transition property', function (done) {
        testTransitionEndCallback.call(this, done, 'all', 'left');
    });

    it('should call the transitionEndCallback for a specified string for transition property', function (done) {
        testTransitionEndCallback.call(this, done, 'left');
    });

    it('should not unbind the transitionend listener by default', function (done) {
        var self = this;
        spyOn(this.elem, 'removeEventListener');
        testTransitionEndCallback.call(this, function () {
            expect(self.elem.removeEventListener).not.toHaveBeenCalled();
            done();
        }, 'left');
    });

    it('should unbind the transitionend listener with removeListenerAfterTransition boolean', function (done) {
        var self = this;
        spyOn(this.elem, 'removeEventListener');
        testTransitionEndCallback.call(this, function () {
            expect(self.elem.removeEventListener).toHaveBeenCalled();
            done();
        }, 'left', null, null, true);
    });

    describe('string list for properties', function () {
        afterEach(function (done) {
            var self = this;

            setTransition.call(this, 'left 1ms, width 1ms, top 1ms');
            transitionEnd(this.elem, this.endCallback, this.propertyList);
            this.elem.style.left = '100px';
            this.elem.style.top = '100px';
            this.elem.style.width = '95px';


            setTimeout(function () {
                expect(self.endCallback.calls.count()).toEqual(1);
                expect(self.endCallback).toHaveBeenCalledWith(
                    [mockEventWithProp('top'), mockEventWithProp('left'), mockEventWithProp('width')]
                );
                done();
            }, 50);
        });

        it('should call the transitionEndCallback once after all transition completed in a space separated list of properties', function () {
            this.propertyList = 'left width top';
        });

        it('should call the transitionEndCallback once after all transition completed in a comma separated list of properties', function () {
            this.propertyList = 'left, width, top';
        });
    });

    describe('propertyName to callback map', function () {
        afterEach(function (done) {
            var self = this;

            setTimeout(function () {
                expect(self.endCallback.calls.count()).toEqual(1);
                expect(self.endCallback).toHaveBeenCalledWith(self.calledWith);

                if (self.endCallback2) {
                    expect(self.endCallback2.calls.count()).toEqual(1);
                    expect(self.endCallback2).toHaveBeenCalledWith(self.calledWith2);
                }

                done();
            }, 50);
        });


        it('should take a map of property name to callback', function () {
            var self = this;
            this.calledWith = [mockEventWithProp('left')];

            setTransition.call(self, 'left 1ms');
            transitionEnd(self.elem, {
                left: self.endCallback
            });
            self.elem.style.left = '100px';
        });

        it('should take a map of multiple property names to callback', function () {
            var self = this;
            this.calledWith = [mockEventWithProp('left'), mockEventWithProp('width')];

            setTransition.call(self, 'left 1ms, width 1ms');
            transitionEnd(self.elem, {
                'left width': self.endCallback
            });
            self.elem.style.left = '100px';
            self.elem.style.width = '95px';
        });

        it('should take a map of property names to callback with more than 1 member and callback', function () {
            var self = this;
            this.endCallback2 = jasmine.createSpy('transitionEndCallback');
            this.calledWith = [mockEventWithProp('left'), mockEventWithProp('width')];
            this.calledWith2 = [mockEventWithProp('top'), mockEventWithProp('height')];

            setTransition.call(self, 'left 1ms, width 1ms, top 1ms, height 1ms');
            transitionEnd(self.elem, {
                'left width': self.endCallback,
                'top height': self.endCallback2
            });
            self.elem.style.left = '100px';
            self.elem.style.width = '95px';
            self.elem.style.top = '100px';
            self.elem.style.height = '95px';
        });
    });

    describe('callback should not be called', function () {
        afterEach(function (done) {
            var self = this;

            setTimeout(function () {
                expect(self.endCallback).not.toHaveBeenCalled();
                done();
            }, 50);
        });

        it('should not count bubbled events (require the event.target to be the element given)', function () {
            setTransition.call(this, 'left 1ms');
            transitionEnd(this.elem, this.endCallback, 'left');

            var nestedElem = document.createElement('div');
            setTransition.call(this, 'left 1ms', nestedElem);
            this.elem.appendChild(nestedElem);
            fireEvent(nestedElem, 'transitionend');
        });

    });

    describe('callback called immediately', function () {
        beforeEach(function () {
            spyOn(this.elem, 'addEventListener');
        });

        afterEach(function () {
            expect(this.endCallback).toHaveBeenCalled();
            expect(this.elem.addEventListener).not.toHaveBeenCalled();
        });

        it('should call the transitionEndCallback immediately and not bind an event when element does not have a transition style ', function () {
            transitionEnd(this.elem, this.endCallback, 'left');
        });

        it('should call transitionEndCallback immediately and not bind an event for an unspecified transition property', function () {
            setTransition.call(this, 'left 1ms');
            transitionEnd(this.elem, this.endCallback, 'color');
        });

    });

    function testTransitionEndCallback(done, cssProp, transitionEndProp, eventProp, removeListener) {
        var self = this;
        transitionEndProp = transitionEndProp ? transitionEndProp : cssProp;
        eventProp = eventProp ? eventProp : transitionEndProp;

        setTransition.call(this, cssProp + ' 1ms');
        transitionEnd(this.elem, this.endCallback, transitionEndProp, removeListener);
        this.elem.style.left = '100px';
        setTimeout(function () {
            expect(self.endCallback.calls.count()).toEqual(1);
            expect(self.endCallback).toHaveBeenCalledWith([mockEventWithProp(eventProp)]);
            if (done) {
                done();
            }
        }, 50);
    }

    function createElement() {
        this.elem = document.createElement('div');
        this.elem.style.position = 'absolute';
        this.elem.style.width = '100px';
        this.elem.style.height = '100px';
        document.body.appendChild(this.elem);
    }

    function setTransition(value, customElem) {
        (customElem || this.elem).style.transition = value;
        (customElem || this.elem).style.webkitTransition = value;
    }

    function mockEventWithProp(prop) {
        return jasmine.objectContaining({
            type: 'webkitTransitionEnd',
            propertyName: prop
        });
    }

    function mockEvent(type) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, true, true);
        return event;
    }

    function fireEvent(el, type) {
        var event = mockEvent(type);
        el.dispatchEvent(event);
        return event;
    }
});