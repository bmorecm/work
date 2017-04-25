var AdUtilities = {
    ad_count: 10,
    slots: [],
    prebid: true,
    prebid_slots: [],
    prebid_slot_ids: [],
    requesting_bids: false,
    bid_count: 0,
    define_calls: 0,
    display_calls:0,
    bid_queue: false,
    defineSlot: function(opts){
        if (!window.googletag || !window.ad_params) {
            //////console.log('AdUtilities.injectAd(): Googletag or dart_vars were not available.');
            return;
        }
        //Scope
        var obj = this,
            slot,
            d = window.ad_params,
            rand = Math.random().toString().replace('0.','');

        //Ad options
        var opts = opts || {
            au1 : d.au1,
            au2 : d.au2,
            au3 : d.au3,
            au4 : d.au4,
            //adUnitPath  : '/3051/' + au1 + '/' + au2 + '/' + au3 + '/' + au4,
            spon        : d.spon,
            //id          : 'div-gpt-ad-' + DART_RAND + '-' + ad_id,
            //size        : ['300x250,300x600,320x50,336x280'],
            sizes  : [[300,250],[300,600],[320,50],[336,280]]
        };
        opts['id'] = typeof opts.id != 'undefined' ? opts.id : 'div-gpt-ad-' + rand + '-' + obj.ad_count;
        opts['path'] = '/3051/' + opts.au1 + '/' + opts.au2 + '/' + opts.au3 + '/' + opts.au4;
        opts['el'] = typeof opts.el != 'undefined' ? opts.el : null;
        opts['spon'] = typeof opts.spon != 'undefined' ? opts.spon : d.spon;
        opts['sec'] = typeof opts.section != 'undefined' ? opts.section : d.sec;

        //////console.log(opts['path']);
        if(opts['el']){
            opts['el'].id = opts['id'];
            googletag.cmd.push(function() {
                slot = googletag.defineSlot(opts.path, opts.sizes, opts.id).
                    setTargeting('zone', 'thestir_' + opts.au4 + '_' + d.section).
                    setTargeting('spon', opts.spon).
                    setTargeting('sec',[opts.sec]).
                    setTargeting('au2',[opts.au2]).
                    setTargeting('au3',[opts.au3]).
                    setTargeting('au4',[opts.au4]).
                    addService(googletag.pubads());

                slot['index'] = obj.ad_count;
                slot['bids'] = false;
                slot['existing'] = false;
                slot['au3'] = opts.au3;
                slot['size'] = obj.formatSlotSizes(slot,true);

                obj.define_calls++;
            });
        }

        //slot['deferred'] = typeof opts['deferred'] != 'undefined' && opts['deferred'] ? true : false;
        //////console.log('define slot');
        //////console.log(slot);
        obj.slots.push(slot);
        ////////console.log('slot pushed');
        obj.ad_count++;
        ////////console.log('defined');
        //console.log('gpt define: ' + slot.getSlotElementId() + '/ ' + window.performance.now());
    },
    debug: function(){
        var obj = this;
        var bla = document.createElement('ul');
        $('body').append(bla);
        $(bla).addClass('addebug');

        setInterval(function(){
            ////////console.log(obj.slots.length);
            $(bla).children().remove();
            for(i=0;i<obj.slots.length;i++){
                var li = document.createElement('li');
                li.innerHTML = obj.slots[i].getAdUnitPath();
                $(bla).append(li);
            }
        },200);
    },
    displaySlots: function(slots){
        var obj = this,
            temp_slots = slots || obj.slots,
            slot_length = temp_slots.length,
            indexes = [],
            refresh_queue = [];
        ////console.log('display ads');
        //////console.log(temp_slots);
        //console.log('gpt display slots');
        //console.log(temp_slots);
        for(i=0;i<slot_length;i++){
            var slot = temp_slots[i],
                index = obj.slots.indexOf(slot);
                indexes.push(index);
            //////console.log('display call');
            //////console.log(slot.getSlotElementId());
            if(typeof slot != 'undefined'){
                if(slot['existing']){
                    //alert('refresh');
                    //googletag.cmd.push(function() {googletag.pubads().refresh([slot])});
                    refresh_queue.push(slot);
                    ////console.log('gpt refresh push ' + slot.getElementById());
                    slot['bids'] = false;
                }else{
                   googletag.cmd.push(function() { googletag.display(slot.getSlotElementId())});
                   //console.log('gpt display: ' + slot.getSlotElementId() + '/ ' + window.performance.now());
                   obj.display_calls++;
                }


            }else{
               ////console.log('slot display failed: slot ' + i);
            }
        }
        if(refresh_queue.length){
            googletag.cmd.push(function(){googletag.pubads().refresh(refresh_queue)});
            //console.log(refresh_queue);
            //console.log('gpt refresh: ' + window.performance.now());
        }
        for(var i=indexes.length - 1;i>=0;i--){
            obj.slots.splice(indexes[i],1);
        }

        //////console.log(obj.define_calls + " " + obj.display_calls);
        //obj.slots = [];
    },
    clearPrebidAdUnits: function(){
        var obj = this;
        ////////console.log('removing units');
        //pbjs.adUnits = [];
        for (var i=0; i < pbjs.adUnits.length; i++) {
            pbjs.removeAdUnit(pbjs.adUnits[i]['code']);
        }
        obj.prebid_slot_ids = [];
        obj.prebid_slots = [];
    },
    requestBids: function(refresh){
        var obj = this,
            refresh = refresh || false,
            temp_slots = obj.slots.slice();
        //console.log('gpt requesting all bids');

        //obj.clearPrebidAdUnits();
        obj.requesting_bids = true;
        ////////console.log('requesting bids');
        //////console.log('fire');
        //////console.log(obj.slots.length);
        for(i=0;i<temp_slots.length;i++){

            var slot = temp_slots[i];
            if(typeof slot['bids'] == 'undefined' || !slot['bids']){
                ////console.log('slot');
                ////console.log(slot);
                var index = typeof slot.index != 'undefined' ? slot.index : obj.ad_count,
                    path = slot.getAdUnitPath(),
                    au3 = slot['au3'] == 'leader_int' ? 'leader' : slot['au3'],
                    code = slot.getSlotElementId(),
                    sizes = obj.formatSlotSizes(slot),
                    bids = Prebid_Config.getPrebidBidders(au3, path, sizes, code);
                    //[{
                    //     bidder: 'appnexus',
                    //     params: {
                    //        placementId: '4799418'
                    //     }
                    // }];//

                obj.prebid_slots.push({code: code, sizes: sizes, bids: bids});
                obj.prebid_slot_ids.push(code);
                slot['bids'] = true;
            }

        }
        pbjs.addAdUnits(obj.prebid_slots);
        // ////console.log('prebid slots');
        // ////console.log(obj.prebid_slots);
        // ////console.log(obj.prebid_slot_ids);
        obj.bid_count++;

        //refreshing index exchange bids
        if(typeof setIXprebidSegments != 'undefined')
            setIXprebidSegments();

        pbjs.que.push(function() {
            pbjs.requestBids({
                timeout: PB_INJECTED_TIMEOUT,
                adUnitCodes: obj.prebid_slot_ids,
                bidsBackHandler: function(data) {
                    console.log('bids');
                    console.log(data);
                    console.log(obj.prebid_slot_ids);
                    pbjs.setTargetingForGPTAsync(obj.prebid_slot_ids);

                    ////////console.log('slot comparison');
                    ////////console.log(obj.slots.length + ' ' + obj.prebid_slots.length);
                    ////////console.log(obj.slots);
                    ////////console.log(obj.prebid_slot_ids);
                    obj.requesting_bids = false;
                    //var gpt_slots = typeof window.googletag.getSlots != 'undefined' ? window.googletag.getSlots() : null;
                    ////console.log('before floor');

                    //#13030 - Set AdX dynamic floor for this slot
                    for(var i=0;i<temp_slots.length;i++){
                        window.setDynamicFloor(temp_slots[i]);
                    }

                    ////console.log('after floor');
                    obj.displaySlots(temp_slots);
                    obj.clearPrebidAdUnits();
                    if(obj.bid_queue){
                        obj.bid_queue = false;
                        setTimeout(function(){obj.requestBids();console.log('gpt request again')},100);
                    }
                }
            });
        });
        obj.refreshOtherBidders();

    },
    formatSlotSizes: function(slot,string){
        var temp_sizes = slot.getSizes(),
            size_arr = [],
            string = string || false;
        for(var i=0;i<temp_sizes.length;i++){
            var a = [];
            for(key in temp_sizes[i]){
                var temp = temp_sizes[i][key];
                if(typeof temp == 'number')
                    a.push(temp_sizes[i][key]);
            }
            if(string)
                a = a.toString().replace(/,/g,"x");

            size_arr.push(a);
        }

        return size_arr;
    },
    injectAd : function(opts) {
        //console.log('gpt inject: ' + opts.au3);
        ////console.log(window.googletag.getSlots);
        ////console.log('slots');
        if(typeof window.googletag.pubads().getSlots == 'undefined')
            return;
        var obj = this;
        obj.defineSlot(opts); //defines and pushes to slots array
        ////console.log('injected');
        if(typeof opts.deferred == 'undefined' || (typeof opts.deferred != 'undefined' && !opts.deferred)){
            if(obj.prebid && typeof pbjs != 'undefined' ){
                ////console.log('has prebid');
                if(!obj.requesting_bids){
                    ////console.log('not requesting bids');
                    obj.requestBids();
                }else{
                    obj.bid_queue = true;
                    ////console.log('still requesting bids!');
                    ////console.log(opts);
                }
            }else{
                ////console.log('no prebid');
                obj.displaySlots();
            }
        }


    },
    refreshOtherBidders: function(){
        var slots = this.slots,
            leader_slot = window.gpt_ad_slots[0];
        googletag.cmd.push(function() {

            //Amazon
            var amznCallbackFunction = function(){
                amznads.setTargetingForGPTAsync('amznslots');   // reset custom targeting value by key
                console.log('amazon_bidback');
                console.log(amznads);
                console.log(amznads.getTargeting());
                //googletag.pubads().refresh(slots);
            };

            //Amazon Bids
            if(typeof amznads != 'undefined')
                amznads.getAdsCallback('3055', amznCallbackFunction); //turning amazon refresh back on 2/13
            //googletag.pubads().clearTargeting('amznslots');

            //OPENX REFRESH
            if('OX' in window){
                setOxTargeting = function(slots) {
                    try {
                        if (!slots) {
                            slots = googletag.pubads().getSlots()
                        }
                        var map = OX.dfp_bidder.getPriceMap();
                        //console.log('openx map: ' + JSON.stringify(map));
                        for (i=0;i<slots.length;i++) {
                            var div = slots[i].getSlotId().getDomId();
                            if (div in map) {
                                slots[i].setTargeting('ox'+map[div]['size'],map[div]['price'])
                                //console.log('ox'+map[div]['size'],map[div]['price']);
                            }
                        }
                    } catch(err) {}
                }

                // refresh all slots:
                cb = function() {
                    setOxTargeting();
                    //googletag.pubads().refresh();
                }
                OX.dfp_bidder.refresh(cb);

                // refresh some slots:
                var refresh_slots = [leader_slot];
                cb = function() {
                    setOxTargeting(refresh_slots);
                    //console.log('reset openx bid...');
                    //googletag.pubads().refresh(refresh_slots);
                }
                OX.dfp_bidder.refresh(cb,refresh_slots);
            }
        });
    },
    refreshAd: function(opts){
        //////console.log('refresh unique');
        var obj = this,
            gpt_slots = typeof window.googletag.pubads().getSlots != 'undefined' ? window.googletag.pubads().getSlots() : null,
            $el = $(opts.el),
            id = opts.el.id,
            au3 = opts.au3 || 'default',
            matches = 0;
        //console.log('gpt refresh call ' + id);
        //if(!obj.requesting_bids){
            //////console.log('gpt length');
            //////console.log(gpt_slots.length);
            //////console.log(gpt_slots);
            if(gpt_slots){
                for(i=0;i<gpt_slots.length;i++){
                    var slot = gpt_slots[i];
                    //////console.log('match attempt');
                    //////console.log(id);
                    //////console.log(gpt_slots[i].getSlotElementId());
                    if(id == slot.getSlotElementId()){
                        matches++;
                        //////console.log('refreshing');
                        if(typeof opts.callback != 'undefined' && opts.callback && typeof slot.callback == 'undefined'){
                            slot.callback = opts.callback;
                        }
                        slot['bids'] = false;
                        slot['existing'] = true;
                        slot['au3'] = au3;
                        slot['size'] = obj.formatSlotSizes(slot,true);
                        obj.slots.push(slot);
                        //////console.log('deferred in refresh?')
                        //////console.log(opts.deferred);
                        if(typeof opts.deferred == 'undefined' || (typeof opts.deferred != 'undefined' && !opts.deferred)){
                            if(obj.prebid && typeof pbjs != 'undefined'){
                                if(!obj.requesting_bids){
                                    obj.requestBids();
                                }else{
                                    obj.bid_queue = true;
                                    ////console.log('still requesting bids on refresh!');
                                    ////console.log(slot);
                                }
                            }else{
                                obj.displaySlots();
                            }
                        }
                        break;
                    }
                }
            }
            //////console.log('matches');
            //////console.log(matches);
        //}
    }
}
//AdUtilities.debug();
