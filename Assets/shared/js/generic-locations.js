(function ($) {

    //fx-1656
    document.addEventListener("DOMContentLoaded", function (event) {
        $('.loc-generic #location-generic').on('keydown', function (e) {
            setTimeout(function () {
                $searchVal = $('#location-generic')[0].value;
                var domain = window.location.hostname;
                $('.loc-input-wrapper').find("input[type=text]").attr('data-dataSearch', $searchVal);
                $('.loc-input-wrapper').find("input[type=submit]").attr('data-dataSearch', $searchVal);
                if($('.loc-generic .input-grp-wrapper .submit').length) {
                    $('.loc-generic .input-grp-wrapper').find('.submit').attr('data-dataSearch', $searchVal);
                    if($(this).has('span')) {
                        $('.loc-generic .input-grp-wrapper .submit').find('span').attr('data-dataSearch', $searchVal);
                    }
                }
                if (e.keyCode == 13) {
                    console.warn('!!**$%#', domain);
                    if (domain.indexOf('moes') > -1) {
                        domain = 'Find a Moes';
                    }
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({ event: domain + ' (Generic)', searchTerm: $searchVal });
                    console.warn(JSON.stringify(dataLayer));
                }
            }, 10);
        });
    });

    function getPositionFromGeolocation() {
        var deferred = new $.Deferred();
        var error = deferred.reject.bind(deferred);
        var supportsGeolocation =
            window &&
            window.location &&
            window.navigator &&
            window.navigator.geolocation &&
            $.isFunction(window.navigator.geolocation.getCurrentPosition);

        function success(position) {
            //console.log('success', position);
            var hasLatLng =
                position &&
                position.coords &&
                position.coords.latitude &&
                position.coords.longitude;

            if (hasLatLng) {
                deferred.resolve(position.coords);
            } else {
                deferred.reject("Unable to determine location.");
            }
        }

        if (!supportsGeolocation) {
            //console.log('order now supportsGeolocation fail');
        } else {
            navigator.geolocation.getCurrentPosition(success, error);
        }

        return deferred.promise();
    }
    //google analytics old style override TODO: new GTM work
    function gtag() {
        console.log('gtag');
    }

    function trackLocationGo(caller, filterList, passedVals) {
        filterList = filterList || '';
        var val = $('#location').val();
        var terms;
        var filters = filterList ? '-Filter-' + filterList : '';
        var startString;
        terms = val ? terms = val : '';
        if (caller === 'generic') {
            //console.log('*!*!*!*!*!generic locationGo',terms, passedVals);
            if (ga && ga !== undefined || ga !== null && passedVals) {
                gtag('event', 'event', {
                    'event_category': 'Sub-Search-Form',
                    'event_action': 'Go - ' + passedVals
                });
            }

        } else {
            if (val.length) {
                if (!filters.length) {
                    startString = 'Search-Term-Go-'
                } else if (filters.length) {
                    startString = 'Go-Search-Term-'
                }
                if (ga) {
                    gtag('event', 'event', {
                        'event_category': 'Global Nav-Locate',
                        'event_action': startString + terms + filters
                    });
                }
            }
        }
    }

    function locGenericFormValidate() {
        var $locWrapper = $('.loc-generic');
        var $locForm = $locWrapper.find('#location-form-generic');
        var locFormErrorTxt = $locWrapper.find('#noLocationResults').val();
        var $locInput = $locWrapper.find('#location-generic');
        var $findMeGeneric = $('.findme-btn-generic');
        var $AddressLatitudeGeneric = $('input[name=AddressLatitudeGeneric]');
        var $AddressLongitudeGeneric = $('input[name=AddressLongitudeGeneric]');
        var $locFormAction = $locForm.attr('action');
        var termGA;
        var locInpVal;

        var subBtn = $locForm.find('button.submit');
        var locInput = $locForm.find('input[type=text]');
        var placeholder = $locForm.find('.ph');
        var errTxt = $locWrapper.parent().find('#locationFormError').val();
        var $errSpan = '<span class="error-label">' + errTxt + '</span>';

        $findMeGeneric.on('click', function () {
            //event.preventDefault();
            event.stopImmediatePropagation();
            locInpVal = $locInput.val();

            // console.log('locInpVal',locInpVal);
            if (locInpVal) {
                termGA = locInpVal;
            } else {
                termGA = ' n/a';
            }
            console.log(termGA);
            //console.log("FIND ME GENERIC");
            //if (gtag) {
            gtag('event', 'event', {
                'event_category': 'Sub-Search-Form',
                'event_action': 'Find Me -' + termGA
            });
            //}
            var locationFilterList = "";
            var locationServicesList = "";
            var deliveryServicesList = '';

            var inputBox = $('#location-form-generic .loc-input-wrapper');
            $(inputBox).find('input[name=LocationFilters]').each(function () {
                locationFilterList += "&LocationFilters=" + $(this).val();
            })

            $(inputBox).find('input[name=LocationServices]').each(function () {
                locationServicesList += "&LocationServices=" + $(this).val();
            })

            $(inputBox).find('input[name=DeliveryServices]').each(function () {
                deliveryServicesList += "&DeliveryServices=" + $(this).val();
            })

            geoResults = getPositionFromGeolocation();
            geoResults.done(function (coords) {

                var lat = coords.latitude.toString();
                var long = coords.longitude.toString();
                $AddressLatitudeGeneric.val(lat);
                $AddressLongitudeGeneric.val(long);

                console.log(locationFilterList);

                window.location = $locFormAction + '?AddressLatitude=' + lat + '&AddressLongitude=' + long + locationFilterList + locationServicesList + deliveryServicesList;

            }).fail(function (err) {

                if (err === null || err === undefined) {
                    //window.alert('could not find your location');
                } else if (err.code === 1) {
                    //window.alert('you must allow the device to use location services');
                } else {
                    //window.alert('could not find your location');
                }
            });
        })

        subBtn.off().on('click', function (event) {
            //console.log("SUBMIT GENERIC");
            event.preventDefault();

            var errExist = $errSpan.length;
            // console.log('errExist', errExist);
            // console.log('locFormValidate CLICKS', errExist, locInput, $(locInput).val(), );

            trackLocationGo('generic', null, $(locInput).val());

            if ($(locInput).val()) {
                $locForm.submit();
            }

            if (!$(locInput).val() && errExist != 1) {
                //console.log('should be adding err');
                $($errSpan).insertAfter(locInput);
                $('.error-label').css('font-size', '1.3rem').addClass('generic-loc-error');
                //$errSpan.html(locFormErrorTxt).css('opacity','1');
                locInput.addClass('fcs-error');
            } else if (!$(locInput).val() && errExist) {
                event.preventDefault();
            }
        });
        $locInput.on('focus', function () {
            var errExist = $errSpan.length;
            placeholder.css('opacity', '1');
            //console.log('FOCUS placeholder',errExist);
            if (errExist != 0) {
                $('.error-label').remove();
                //$errSpan.css('opacity','0');
                locInput.removeClass('fcs-error');
            }
        });
        $locInput.on('blur', function () {
            placeholder.css('opacity', '0');
        });
        //}
        // Show validation when user
        // hits enter in the location field
        $locInput.on('keyup', function (e) {
            var errExist = $($errSpan).css('opacity');
            if (e.keyCode == 13) {
                e.preventDefault();
                if (!$(this).val()) {
                    $(placeholder).css('display', 'none');
                    $errSpan.css('opacity', '1');
                }
            }
        })
    }

    locGenericFormValidate();
})(jQuery);
