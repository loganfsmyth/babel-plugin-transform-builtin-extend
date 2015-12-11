import {expect} from 'chai';

describe('standard extension', function(){
    describe('Array', function(){
        class MyArray extends Array {
            constructor(){
                super();
                Object.defineProperty(this, '_i', {
                    writable: true,
                    value: 0,
                });
            }

            myPush(){
                this.push(this._i++);
            }
        }

        it('should behave properly', function(){
            const a = new MyArray();

            expect(Array.isArray(a)).to.be.true;
            expect(a instanceof MyArray).to.be.true;

            a.myPush();
            a.myPush();
            expect(a).to.eql([0, 1]);

            a[20] = 'foo';

            expect(a.length).to.eql(21);
        });
    });

    describe('Error', function(){
        class MyError extends Error {
            constructor(message){
                super(message);
            }
        }

        it('should behave properly', function(){
            const a = new MyError('a message');

            expect(a instanceof MyError).to.be.true;

            expect(a).to.have.ownProperty('message');
            expect(a).to.have.ownProperty('stack');

            expect(a.message).to.eql('a message');
        });
    });
});
