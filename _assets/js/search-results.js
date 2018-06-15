var PAGE_FILTER = " more:pagemap:metatags-restype:";
var GCSE_ELEMENT_NAME = "google-search";
var observer = new MutationObserver(observeCallback);
var searchTerms = "";
var isObserving = false;

var searchViewModel = kendo.observable({
    kb: false,
    docs: false,
    api: false,
    label: "",
    filterValues: [],
    getFilter: function () {
        var filterExpression = '';
        for (var i = 0; i < this.filterValues.length; i++) {
            if (filterExpression !== '') {
                filterExpression += ',';
            }

            filterExpression += this.filterValues[i];
        }

        return filterExpression;
    },
    updateLabel: function () {
        var label = "";
        this.filterValues = [];

        if ((this.kb && this.docs && this.api) || (!this.kb && !this.docs && !this.api)) {
            label = "Search all";
        } else {
            if (this.docs) {
                label += "DOCS";
                this.filterValues.push('documentation');
            }

            if (this.kb) {
                label += (label ? " / " : "") + "KB";
                this.filterValues.push('kb');
            }

            if (this.api) {
                label += (label ? " / " : "") + "API";
                this.filterValues.push('api');
            }

            label = "Search in " + label;
        }

        this.set("label", label)
    }
});

function startObserving() {
    if (isObserving) {
        return;
    }
    var gcseResults = $("div.gsc-results");
    if (gcseResults.length) {
        var target = gcseResults.get(0);
        var observerConfiguration = { childList: true };
        observer.observe(target, observerConfiguration);
    }

    isObserving = true;
}

function stopObserving() {
    if (!isObserving) {
        return;
    }
    
    observer.disconnect();
    isObserving = false;
}

function gcse_callback() {
    if (document.readyState == 'complete') {
        updateLayout();
    } else {
        google.setOnLoadCallback(function () {
            loadSearch();
            startObserving();
        }, true);
    }
}

function loadSearch() {
    $("#page-search table.gsc-search-box > tbody > tr")
        .append($("<td id='refine-search-container'><div id='refine-search-button' class='unselectable'><span id='refine-search-label' data-bind='text: label'></span><span class='k-icon k-i-arrow-chevron-down'></span></div></td>"));

    var popup = $("#refine-search-popup").kendoPopup({
        anchor: $("#page-search table.gsc-search-box"),
        origin: "bottom right",
        position: "top right",
    }).data("kendoPopup");

    $("#page-search #refine-search-button").on("click", function () {
        popup.toggle();
    });

    var resources = {};

    searchViewModel.updateLabel();

    kendo.bind($("#page-search"), searchViewModel);
    kendo.bind($("#refine-search-popup"), searchViewModel);

    $(".custom-checkbox input[type='checkbox']").change(function () {
        searchViewModel.updateLabel();
    });

    attachToEvents();
    onSearchLoaded();
}

function search() {
    onBeforeSearch();

    var element = google.search.cse.element.getElement(GCSE_ELEMENT_NAME);
    if (element) {
        searchTerms = $(".gsc-input-box .gsc-input").val();
        var filterExpression = searchViewModel.getFilter();
        trackSearchQuery(filterExpression, searchTerms);
        filterExpression = filterExpression !== '' ? PAGE_FILTER + filterExpression : '';
        element.execute(searchTerms + filterExpression);

        $(".gsc-input-box .gsc-input").val(searchTerms);
    }

    onAfterSearch();
}

function onSearchLoaded() {
    updateLayout();
    onSearchLoadedInternal();
}

function onSearchLoadedInternal() { }

function onBeforeSearch() {
    startObserving();
    $('#no-results').hide();
}

function onAfterSearch() {
    onAfterSearchInternal();
}

function onAfterSearchInternal() { }

function arrangeResults() {
    if ($('div.gs-no-results-result div.gs-snippet').length) {
        $('#no-results').show();
    }
}

function updateLayout() {
    arrangeResults();
    setSideNavPosition();
}

function closePopup() {
    var popup = $("#refine-search-popup").data("kendoPopup");
    popup.close();
}

function searhInternal() {
    closePopup();
    search();
}

function attachToEvents() {
    var oldInput = $('.gsc-input input[type="text"]');
    var newInput = oldInput.clone();
    oldInput.replaceWith(newInput);
    newInput.keydown(function (e) {
        if (e.keyCode == 13) { // Enter
            searhInternal();
            return false;
        }
    });

    var oldSearchButton = $('.gsc-search-button input[type="image"].gsc-search-button.gsc-search-button-v2');
    var newSearchButton = oldSearchButton.clone();
    oldSearchButton.replaceWith(newSearchButton);
    newSearchButton.click(function (e) {
        searhInternal();
        return false;
    });

    $("#page-search").on("click", "a.gs-title", function (e) {
        trackSearchResult($(e.target).data("ctorig"));
    });
}

function trackSearchQuery(filter, query) {
    trackItem("docs-search-terms", filter, query);
}

function trackSearchResult(link) {
    trackItem("docs-search-results", searchTerms, link);
}

function trackItem(category, action, label) {
    dataLayer.push({
        'event': 'virtualEvent',
        'eventCategory': category,
        'eventAction': action,
        'eventLabel': label,
    });
}

function observeCallback(mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type == 'childList') {
            updateLayout();
            stopObserving();
        }
    });
}

$(function () {
    function toKV(n) {
        n = n.split("=");
        this[n[0]] = n[1];
        return this;
    }

    var params = location.search.replace(/(^\?)/, '').split("&").map(toKV.bind({}))[0];
    searchTerms = params.q;
    $("[name=q]").val(searchTerms);

    window.__gcse = {
        callback: gcse_callback
    };
});
