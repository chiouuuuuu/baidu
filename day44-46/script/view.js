// 视图层
class View {

    constructor(id, timeScale){
        this.timeScale = timeScale;
        this.$container = document.querySelector(id);       // 最外层盒子
        this.$cashNum = this.$container.querySelector('.cash-bar .count');          // 现金数
        this.$cookList = this.$container.querySelector('.kitchen .cookList ul');    // 待做列表
        this.$cookState = this.$container.querySelector('.kitchen .state');         // 厨师当前状态
        this.$orderedList = this.$container.querySelector('.table .list');          // 餐桌
        this.$customerCt = this.$container.querySelector('.man .customers');        // 顾客
        this.$employeeCt = this.$container.querySelector('.man .employees');        // 员工
        let ctWidth = getComputedStyle(this.$container).width;                      // 最外层盒子的宽高
        let ctHeight = getComputedStyle(this.$container).height;
        transToPx(positions, ctWidth, ctHeight); // 转换之后得到px单位的position值
        this.initialCookState();                //  设置厨师状态
    }

    setCash(cash){
        if(this.$cashNum){
            this.$cashNum.innerText = cash;
        }
    }

    initialCookState() {
        this.$cookState.innerHTML = `<span class="thing">空闲</span><span class="time"></span>`;
    }

    addWaiter(waiter){
        let [initialLeft, initialTop] = positions.waiter.toTable[0];
        let innerHTML = `<div class="waiter" style="background-image: url(${waiter.avatarUrl}); left: ${initialLeft}px; top: ${initialTop}px;"></div>`;
        let $waiter = createElement(innerHTML);
        waiter.element = $waiter;
        this.$employeeCt.appendChild($waiter);
    }

    addChef(chef){
        let [initialLeft, initialTop] = positions.chef.toKitchen;
        let innerHTML = `<div class="chef" style="background-image: url(${chef.avatarUrl}); left: ${initialLeft}px; top: ${initialTop}px;"></div>`;
        let $chef = createElement(innerHTML);

        chef.element = $chef;
        this.$employeeCt.appendChild($chef);
    }

    addCustomer(customer){//1
        let view = this;
        let [initialLeft, initialTop] = positions.customer.initial;
        let $customer = createElement(`<div class="customer" style="background-image: url(${customer.avatarUrl}); left: ${initialLeft}px; top: ${initialTop}px;"></div>`);

        customer.element = $customer;
        this.$customerCt.appendChild($customer);
    }

    addWord($elm, string){
        let msgTime = timeUnit.msgTime;
        let time = msgTime * this.timeScale;

        string = string.trim();

        showMessage($elm, string, time);

        function showMessage($elm, string, time){
            let start = new Date();

            $elm.style.zIndex = 1;

            return requestAnimationFrame(function update(){
                let now = new Date();
                let offset = now - start;

                $elm.innerHTML = `<div class="msg">${string}</div>`;

                if(offset < time){
                    requestAnimationFrame(update);
                }else{
                    $elm.innerHTML = '';
                    $elm.style.zIndex = 0;
                }
            });
        }
    }

    moveToQueue(customer, queue){
        let $view = this;

        return new Promise((resolve, reject)=>{
            let enterTime = timeUnit.customer.enter;    // 移动时间
            let timeScale = $view.timeScale;            // 时间尺度
            let time = enterTime * timeScale;           // 移动时间
            let position = positions.customer.enter;    // 第一步目标位置
            animation(customer.element, position, time, resolve);
        }).then(()=>{
            let idx = queue.getQueue().indexOf(customer);

            if(idx === -1){
                let enterTime = timeUnit.customer.enter;
                let timeScale = $view.timeScale;
                let time = enterTime * timeScale;
                let position = positions.customer.initial;
                animation(customer.element, position, time, callback);
            }else{
                let toLineTime = timeUnit.customer.toLine[idx];
                let timeScale = $view.timeScale;
                let time = toLineTime * timeScale;
                let position = positions.customer.toLine[idx];
                return new Promise((resolve, reject)=>{
                    animation(customer.element, position, time, resolve);
                });
            }

        });

        function callback(resolve){
            let children = $view.$customerCt.children;
            let idx = Array.from(children).indexOf(customer.element);
            console.log(idx);
            if(idx !== -1){
                $view.$customerCt.removeChild(customer.element);
            }

        }
    }

    moveToSeat($elm, idx){//1
        let timeScale = this.timeScale;
        let toSeatTime = timeUnit.customer.toSeat[idx];
        let time = timeScale * toSeatTime;
        let position = positions.customer.toSeat[idx];

        return new Promise((resolve, reject)=>{
            animation($elm, position, time, resolve);
        });
    }

    orderFood(customer){
        let orderTime = timeUnit.customer.order;
        let timeScale = this.timeScale;
        let time = orderTime * timeScale

        return new Promise((resolve, reject) =>{
            setTimeout(()=>{resolve(customer.element)}, time);
        });
    }

    updataOrdered(foods){
        let innerHTML = foods.reduce((innerHTML, food) =>{
            if(food.state === 'serving'){
                return innerHTML + `<li class="serving"><span>${food.name}</span><i>正在做</i></li>`;
            }else if(food.state === 'served'){
                return innerHTML + `<li class="served"><span>${food.name}</span><i>已上菜</i></li>`;
            }else if(food.state === 'eated'){
                return innerHTML + `<li class="eated"><span>${food.name}</span><i>已吃完</i></li>`;
            }
        }, '');

        this.$orderedList.innerHTML = innerHTML;
    }

    moveToTable(waiter, idx){
        let tableName = 'table' + idx;

        if(tableName === waiter.position){
            return Promise.resolve();
        }else{
            let timeScale = this.timeScale;
            let toTableTime = timeUnit.waiter.toTable[idx];
            let time = toTableTime * timeScale;
            let position = positions.waiter.toTable[idx];

            return new Promise((resolve, reject)=>{
                let callbackBind = callback.bind(this, resolve, tableName);
                animation(waiter.element, position, time, callbackBind);
            });

            function callback(resolve, tableName){
                waiter.position = tableName;
                resolve();
            }
        }
    }

    moveToKitchen(waiter){
        let waiterPosition = waiter.position;


        if(waiterPosition === 'kitchen'){
            return Promise.resolve();
        }else{
            let timeScale = this.timeScale;
            let toKitchenTime = timeUnit.waiter.toKitchen;
            let time = toKitchenTime * timeScale;
            let position = positions.waiter.toKitchen;

            return new Promise((resolve, reject)=>{
                let callbackBind = callback.bind(this, resolve, 'kitchen');
                animation(waiter.element, position, time, callbackBind);
            });

            function callback(resolve, kitchen){
                waiter.position = kitchen;
                resolve();
            }
        }
    }

    updateCookList(foods){
        this.$cookList.innerHTML = '';

        let innerHTML = foods.reduce((innerHTML, food) =>{
            return innerHTML + `<li>${food.name}</li>`;
        }, '');

        this.$cookList.innerHTML = innerHTML;
    }

    updateCookState(food){
        let $cookState = this.$cookState;
        let cookTime = food.cookTime * this.timeScale;
        return new Promise((resolve, reject)=>{
            kitchenStateUpdate(resolve);
        });

        function kitchenStateUpdate(resolve){
            let start = new Date();

            return requestAnimationFrame(function update(){
                let now = new Date();
                let offset = now - start;

                let innerHTML = `<span class="thing">正在做：${food.name}</span><span class="time">${transTime(cookTime - offset)}</span>`;

                $cookState.innerHTML = innerHTML;

                if(offset < cookTime){
                    requestAnimationFrame(update);
                }else{
                    resolve();
                }
            });
        }
    }

    moveToExit(customer){
        let $view = this;
        let timeScale = this.timeScale;
        let toExitTime = timeUnit.customer.toExit;
        let time = toExitTime * timeScale;
        let position = positions.customer.toExit;

        new Promise((resolve, reject)=>{
            animation(customer.element, position, time, resolve);
        }).then(()=>{
            let customers = $view.$customerCt.children;
            let idx = Array.from(customers).indexOf(customer.element);
            if(idx !== -1){
                $view.$customerCt.removeChild(customers[idx]);
            }
        });
    }

    updateQueue(queue){
        let timeScale = this.timeScale;

        roll(0);

        function roll(idx){
            let queueArray = queue.getQueue();
            let customer = queueArray[idx];

            new Promise((resolve, reject) =>{
                let toNextTime = timeUnit.customer.toNext;
                let time = toNextTime * timeScale;
                let position = positions.customer.toLine[idx];

                animation(customer.element, position, time, callback);

                function callback(){
                    if(queueArray[idx + 1]){
                        roll(idx + 1);
                    }
                    resolve();
                }
            });
        }
    }

    removeOrderedList(){
        this.$orderedList.innerHTML = '';
    }

    eating(customer){
        let eatTime = timeUnit.customer.eat;
        let timeScale = this.timeScale;
        let time = eatTime * timeScale;

        return new Promise((resolve, reject)=>{
            setTimeout(()=>{
                resolve();
            }, time);
        });
    }
}

function transToPx(positions, ctWidth, ctHeight) {
    ctWidth = parseFloat(ctWidth);
    ctHeight= parseFloat(ctHeight);
    roll(positions);
    function roll(object) {
        if (Array.isArray(object)) {
            rollArray(object);
        } else {
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    roll(object[key]);
                }
            }
        }
    }

    function rollArray(array) {
        array.forEach((item, idx)=> {
            if (Array.isArray(item)) {
                rollArray(item);
            }else if (typeof item === 'number') {
                if (idx === 0) {
                    array[idx] = ctWidth * item /100;
                }else if (idx === 1) {
                    array[idx] = ctHeight * item / 100;
                }
            }
        })
    }
}

function animation($elm, position, time, callback){

    let start = new Date();
    let startLeft = parseFloat(getComputedStyle($elm).left);    // 距离左边的距离
    let startTop = parseFloat(getComputedStyle($elm).top);      // 距离右边的距离
    let distenceLeft = position[0] - startLeft;                 // 距离目标点距离
    let distenceTop = position[1] - startTop;

    return requestAnimationFrame(function step(){
        let now = new Date();
        let offset = (now - start) / time;  // 偏移量
        let left = startLeft + distenceLeft * offset;
        let top = startTop + distenceTop * offset;
        $elm.style.left = left + 'px';
        $elm.style.top = top + 'px';

        if(offset < 1){
            requestAnimationFrame(step);
        }else{
            if(callback){
                callback();
            }
        }
    });
}
