export default async ({addon}) => {
    const vm = addon.tab.traps.vm;
    //var oldFn = vm.setEditingTarget

    vm.startDrag = function(x,y){
        return;
    }
    vm.stopDrag = function (targetId) {
        return;
    }

    /*vm.setEditingTarget = function(a){
        //const rect = document.querySelector("canvas").getBoundingClientRect()
        const mouse = vm.runtime.ioDevices.mouse;
        const [x, y] = [mouse._x, mouse._y];
        
        if(rect.left<=x<=rect.right && rect.bottom<=y<=rect.top){
            oldFn.call(this, a);
        }
    }*/
};