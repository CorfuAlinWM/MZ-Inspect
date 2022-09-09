var PageSearchComponent = (function PageSearchComponent($) {
    var $component = $('body').find('.page-search-component');
    var thisBrand = $('#segmentID').val();
    var settings = resultData;

    function getLocationServices($currentComponent) {
        return $currentComponent.find('input[name="LocationServices"]');
    }
    function getDeliveryServices($currentComponent) {
        return $currentComponent.find('input[name="DeliveryServices"]');
    }

    function attachEvents() {
        $component.each(function () {
            var $form = $(this).find('.location-pushdown-generic');
            var $formInput = $(this).find('input[name="location"]');
            var $findMe = $(this).find('.find-me');
            var $loadMore = $(this).find('.val-show-more-locs');
            var $listWrapper = $(this).find('.store-locator-items');

            $findMe.off().on('click', function (e) {
                $findMe.addClass('sp-circle');
                e.preventDefault();
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        var attr = $form.attr('action');
                        if (typeof attr === 'undefined' || !attr || !attr.length) {
                            $findMe.removeClass('sp-circle');
                            getResults(false, getLocationServices($component), getDeliveryServices($component), false, $form.find('input[name="location"]').val(), $form, $listWrapper, 'findme', position);
                        } else {
                            var locationFilterList = '';
                            var locationServicesList = '';
                            $component.find('input[name=LocationFilters]').each(function () {
                                locationFilterList += '&LocationFilters=' + $(this).val();
                            });
                            $component.find('input[name=LocationServices]').each(function () {
                                locationServicesList += '&LocationServices=' + $(this).val();
                            });
                            window.location = attr + '?addressLatitude=' + position.coords.latitude + '&addressLongitude=' + position.coords.longitude + locationFilterList + locationServicesList;
                        }
                    },
                    function (error) {
                        if (error.code === error.PERMISSION_DENIED) {
                            $findMe.removeClass('sp-circle');
                        }
                    });
                } else {
                    console.log('Geolocation is not supported by this browser.');
                }
            });

            $form.validate({
                rules: {
                    location: {
                        required: true
                    }
                },
                messages: {
                    location: 'Please enter your search terms',
                },
                errorElement: 'span',
                errorPlacement: function (error, element) {
                    $(error).insertAfter(element).addClass('error-label');
                },
                focusCleanup: false,
                focusInvalid: false,
                submitHandler: function (validatedForm) {
                    submitSearch(validatedForm);
                }
            });

            $form.on('submit', function (e) {
                e.preventDefault();
            });

            function submitSearch(validatedForm) {
                var attr = $form.attr('action');
                if (typeof attr === 'undefined' || !attr || !attr.length) {
                    $component.find('.no-results-found').hide();
                    var val = $form.find('input[name="location"]').val();

                    getResults(false, getLocationServices($component), getDeliveryServices($component), false, val, $form, $listWrapper, 'input', null);
                } else {
                    validatedForm.submit();
                }
            }

            $loadMore.on('click', function (e) {
                e.preventDefault();

                revealMore($(this), $listWrapper);
                setTimeout(function () {
                    $('body').addClass('focus-outlines');
                }, 200)
            });
        });
    }

    function revealMore($btn, $listWrapper) {
        var $itemsHidden = $listWrapper.find('.loc-results-item-wrapper:hidden');

        for (var i = 0; i < 6; i++) {
            $itemsHidden.eq(i).show();

            if (i === 0) {
                $('.focus-outlines .store-locator-items').find('.loc-results-item-wrapper:visible:last').find('.loc-res-title > a').focus();
            }
        }

        $itemsHidden = $listWrapper.find('.loc-results-item-wrapper:hidden');
        if (!$itemsHidden.length) {
            $btn.hide();
        }
    }

    function getResults(isFindMe, $locationServices, $deliveryServices, isOpenNow, requestData, $resultsForm, $listWrapper, requestType, position) {
        console.log('getResults', isFindMe + ' ' + $locationServices + ' ' + $deliveryServices + ' ' + isOpenNow + ' ' + requestData);
        var resultsURI = $resultsForm.attr('data-get-results-uri');
        var srSearchResults = $('.sr-search-results');

        var deferred = new $.Deferred();
        var self = this;
        var uri = resultsURI;

        var settings = {};
        settings.method = 'GET';
        var locationServices = '';
        var deliveryServices = '';
        var i = 0;

        if (typeof $locationServices !== 'undefined' && $locationServices != null) {
            for (i = 0; i < $locationServices.length; i++) {
                locationServices += '&LocationServices=' + $locationServices.eq(i).val();
            }
        }

        if (typeof $deliveryServices !== 'undefined' && $deliveryServices != null) {
            for (i = 0; i < $deliveryServices.length; i++) {
                deliveryServices += '&DeliveryServices=' + $deliveryServices.eq(i).val();
            }
        }

        switch (requestType) {
            case 'findme':
                settings.url = resultsURI + '?brand=' + thisBrand + '&addressLatitude=' + position.coords.latitude + '&addressLongitude=' + position.coords.longitude + locationServices + deliveryServices;
                console.log('surl findme', settings.url);
                break;
            case 'input':
                var address = requestData;
                settings.url = resultsURI + '?brand=' + thisBrand + '&ZipOrCity=' + address + locationServices + deliveryServices;
                console.log('surl input', settings.url);
                break;
            default:
                break;
        }

        $.ajax(settings).done(function (results) {
            if (results.Errors && results.Errors.length > 0) {
                deferred.reject(results.Errors);
                return;
            }

            //If no results, show no results message and clear list.
            if (results.Locations && !results.Locations.length) {
                console.log('no results');

                var $noResultsElem = $component.find('.no-results-found');
                var searchCriteria = $component.find('input[name="location"]').val();

                if (requestType === 'findme') {
                    searchCriteria = '';
                }

                if (searchCriteria.length > 0) {
                    $noResultsElem.find('#no-results-message-search-criteria').html(searchCriteria);
                } else {
                    $noResultsElem.find('#no-results-message-search-criteria').html('near you');
                }

                $noResultsElem.show();
                $component.find('.load-more-wrapper').hide();

                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: 'zerosearches-pagesearch', searchTerm: $component.find('#location-generic').val()
                });
            } else {
                $component.find('.load-more-wrapper').show();
            }

            if (results.Locations.length === 1) {
                srSearchResults.text(results.Locations.length + ' result for ' + requestData);
            } else if(results.Locations.length === 0) {
                srSearchResults.text('Sorry! No Stores found in the area of ' + requestData + 'Search again with another city, state or zip code.');
            } else {
                srSearchResults.text(results.Locations.length + ' results for ' + requestData);
            }

            addLocations(results.Locations, $listWrapper);

            deferred.resolve('locations');
        }).fail(function () {
            deferred.reject(['Unknown error.']);
        });

        return deferred.promise();
    }

    function createDirectionsUrl(currentLoc) {
        return 'https://maps.google.com/?daddr=' + currentLoc.FullAddress.replace(/ /g, '+');
    }

    function returnHours(currentLoc) {
        if (typeof currentLoc.HoursListing === 'undefined' || !currentLoc.HoursListing || !currentLoc.HoursListing.length || currentLoc.HoursListing === 'undefined') {
            return 'Contact store for hours';
        }

        return currentLoc.HoursListing[0].Value;
    }

    function returnTelephone(currentLoc) {
        if (typeof currentLoc.Tel === 'undefined' || !currentLoc.Tel || currentLoc.Tel === 'undefined') {
            return '';
        }

        return currentLoc.Tel;
    }

    function returnFullAddressCssClass(currentLoc) {
        if (typeof currentLoc.FullAddress === 'undefined' || !currentLoc.FullAddress || currentLoc.FullAddress === 'undefined') {
            return 'hidden';
        }

        return '';
    }

    function getLocationServicesHtml(templateHtml, currentLoc, currentService) {
        return templateHtml
            .replace(/{{serviceIcon}}/g, currentService.IconUrl)
            .replace(/{{serviceIconAlt}}/g, currentService.Name)
            .replace(/{{storeNumber}}/g, currentLoc.StoreNumber)
            .replace(/{{serviceName}}/g, currentService.Name);
    }

    function getDeliveryServicesHtml(templateHtml, currentLoc, currentService) {
        return templateHtml
            .replace(/{{deliveryURL}}/g, currentService.DeliveryUrl)
            .replace(/{{deliveryName}}/g, currentService.Name)
            .replace(/{{deliveryIcon}}/g, currentService.IconUrl)
            .replace(/{{deliveryIconAlt}}/g, currentService.Name)
            .replace(/{{locationName}}/g, currentLoc.AlternativeName)
            .replace(/{{storeNumber}}/g, currentLoc.StoreNumber);
    }

    function addLocations(locations, $listWrapper) {
        var templateLocation = document.getElementById('template-store-locator-item');
        var templateDeliveryService = document.getElementById('template-delivery-service');
        var templateLocationService = document.getElementById('template-location-service');
        var locationsHtml = '';
        var i = 0;
        var j = 0;

        for (i = 0; i < locations.length; i++) {
            var currentLoc = locations[i];
            var locationServiceHtml = '';
            var deliveryServiceHtml = '';
            var currentLocationHtml = templateLocation.innerHTML;

            for (j = 0; j < currentLoc.LocationServices.length; j++) {
                locationServiceHtml += getLocationServicesHtml(templateLocationService.innerHTML, currentLoc, currentLoc.LocationServices[j]);
            }

            for (j = 0; j < currentLoc.DeliveryServices.length; j++) {
                deliveryServiceHtml += getDeliveryServicesHtml(templateDeliveryService.innerHTML, currentLoc, currentLoc.DeliveryServices[j]);
            }

            currentLocationHtml = currentLocationHtml
                .replace(/{{storeNumber}}/g, currentLoc.StoreNumber)
                .replace(/{{locationName}}/g, currentLoc.AlternativeName)
                .replace(/{{deliveryServicesClasses}}/g, !settings.showDeliveryServices || !currentLoc.DeliveryServices.length ? 'hidden' : '')
                .replace(/{{locationServicesClasses}}/g, !settings.showLocationServices || !currentLoc.LocationServices.length ? 'hidden' : '')
                .replace(/{{CTAOrderClasses}}/g, !settings.showOrderNow || !currentLoc.OnlineOrdering ? 'hidden' : '')
                .replace(/{{CTACateringClasses}}/g, !settings.showOrderCatering || !currentLoc.CateringLink ? 'hidden' : '')
                .replace(/{{addressClasses}}/g, returnFullAddressCssClass(currentLoc))
                .replace(/{{deliveryServices}}/g, settings.showDeliveryServices ? deliveryServiceHtml : '')
                .replace(/{{locationServices}}/g, settings.showLocationServices ? locationServiceHtml : '')
                .replace(/{{locationPageHref}}/g, currentLoc.LocationPageUrl.replace('en/index.html', 'index.html'))
                .replace(/{{distance}}/g, settings.showDistance ? currentLoc.Distance : '')
                .replace(/{{hoursListing}}/g, settings.showOpenHours ? returnHours(currentLoc) : '')
                .replace(/{{streetAddress}}/g, currentLoc.StreetAddress)
                .replace(/{{directionsUrl}}/g, createDirectionsUrl(currentLoc))
                .replace(/{{secondLine}}/g, currentLoc.SecondLine)
                .replace(/{{onlineOrdering}}/g, currentLoc.OnlineOrdering)
                .replace(/{{cateringLink}}/g, currentLoc.CateringLink)
                .replace(/{{tel}}/g, returnTelephone(currentLoc));
            locationsHtml += currentLocationHtml;
        }

        $listWrapper.addClass('show').html(locationsHtml);

        var $loadBtn = $listWrapper.closest('.page-search-component').find('.val-show-more-locs');
        var $items = $listWrapper.find('.loc-results-item-wrapper').hide();
        if ($items.length > 6) {
            $loadBtn.css('display', 'inline-block');
        }

        for (i = 0; i < 6; i++) {
            $items.eq(i).show();
        }
    }

    function init() {
        if (!$component.length) return;
        attachEvents();
    }

    return {
        init: init,
        close: close
    };
}(jQuery));

document.addEventListener('DOMContentLoaded', function () {
    PageSearchComponent.init();
});