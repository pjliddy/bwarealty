'use strict';

// set path to Google Sheet with listing data (JSON feed)

var listingPath = "https://spreadsheets.google.com/feeds/list/1hzXzXdK1fqgaZC_eQdxLRFkUOHlW7puy9w9CPrNl5uE/od6/public/values?alt=json";

// initialize global listing data object
var listingsObj = {};

// global listing data object constructor

var ListingData = function ListingData() {
  data: [];
};

// initialize data from Google Sheets JSON feed

ListingData.prototype.setData = function (feedData) {
  var _this = this;

  // initialize data array
  this.data = [];
  // iterate through listing objects in JSON data feed
  feedData.forEach(function (obj) {
    // create an empty object for each listing
    var newObj = {};
    // iterate through properties of google sheet JSON feed
    for (var prop in obj) {
      // only save name:value pairs beginning with 'gsx$'
      if (prop.startsWith('gsx$')) {
        // slice off the first 4 chars of the property name
        var newProp = prop.slice(4);
        // and take the value of $t for that property
        newObj[newProp] = obj[prop].$t;
        // convert list of image names into an array
        if (newProp === 'images') {
          var arr = newObj[newProp].split(',');
          // remove whitespace before or after comma delimiter
          arr.forEach(function (e, i, a) {
            a[i] = e.trim();
          });
          newObj[newProp] = arr;
        }
      }
    }
    // push the new data object onto the listing data array
    _this.data.push(newObj);
  });
};

//
// Template Rendering Functions
//

// render template and return html content

function renderTemplate(source, data) {
  var template = Handlebars.compile(source);
  var content = template({ data: data });
  return content;
}

// render template and insert in target element

function replaceTemplate(target, source, data) {
  var template = Handlebars.compile(source);
  var content = template({ data: data });
  $(target).html(content);
}

// render template and append to target element

function appendTemplate(target, source, data) {
  var template = Handlebars.compile(source);
  var content = template({ data: data });
  $(target).append(content);
}

// clear element from DOM

function removeTemplate(target) {
  $(target).remove();
}

// display modal

function showModal(content) {
  // if there's already a modal
  if ($('.modal').length) {
    // replace the existing modal
    replaceTemplate($('.modal')[0], content);
  } else {
    // append a new modal to the body
    $('body').append(content);
  }
  // display modal
  $('.modal').modal('show');
}
//
// AJAX calls
//

// make AJAX call to JSON feed and return promise

function getListingData(path) {
  return $.ajax({
    url: path,
    cache: true
  });
}

// make AJAX call to Handlebars template file and return promise

function getTemplate(path) {
  return $.ajax({
    url: path,
    cache: true
  });
}

//  Submit Contact Form

function submitContact(data) {
  return $.ajax({
    url: "./cgi/submit.php",
    type: "POST",
    data: data,
    cache: false
  });
}

//
//  Listing Detail Functions
//

// get data from listingData array from mls number

function getDetailData(mls) {
  // return individual data object from listingData with mls number
  var result = listingsObj.data.find(function (e) {
    return e.mls == mls;
  });
  return result;
}

// render and display listing detail in a full screen modal

function showDetails(mls) {
  // getModalTemplate('body','js/templates/detail-modal.hbs', mls);
  getTemplate('js/templates/modal-detail.hbs').then(function (template) {
    var data = getDetailData(mls);
    var content = renderTemplate(template, data);
    showModal(content);
  }).fail(function (err) {
    return console.log('listing template is not available');
  });
}

// jQuery Gallery Setup

function setUpGallery() {
  // $('.flexslider').flexslider({
  //   animation: "slide"
  // })

  $('#carousel').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    itemWidth: 210,
    itemMargin: 5,
    asNavFor: '#slider'
  });

  $('#slider').flexslider({
    animation: "slide",
    controlNav: false,
    animationLoop: false,
    slideshow: false,
    sync: "#carousel"
  });
}

//
//  Contact Submission Functions
//

function showSubmitError() {
  getTemplate('js/templates/modal-submit-error.hbs').then(function (template) {
    var content = renderTemplate(template);
    showModal(content);
  }).fail(function (err) {
    return console.log('submit errror template is not available');
  });
}

function showSubmitSuccess() {
  getTemplate('js/templates/modal-submit-success.hbs').then(function (template) {
    var content = renderTemplate(template);
    showModal(content);
  }).fail(function (err) {
    return console.log('submit success template is not available');
  });
}
//
//  Event Handlers
//

function handleEvents() {
  // jQuery for page scrolling feature using jQuery Easing plugin
  $('a.page-scroll').bind('click', function (event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: $($anchor.attr('href')).offset().top - 50
    }, 800, 'easeInOutExpo');
    event.preventDefault();
  });

  // Highlight the top nav as page scrolls
  $('body').scrollspy({
    target: '.navbar-fixed-top',
    offset: 51
  });

  // Close the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function () {
    $('.navbar-toggle:visible').click();
  });

  // Offset for Main Navigation
  $('#mainNav').affix({
    offset: {
      top: 100
    }
  });

  // show listing detail modal when "see more" is clicked
  $('.listings').on('click', '.see-more', function (e) {
    showDetails($(e.target).data('mls'));
  });

  // submit contact form
  $('#contact-form').submit(function (event) {
    event.preventDefault();
    var email = $("input#email").val();
    var data = {
      email: email
    };
    submitContact(data).then(showSubmitSuccess).fail(showSubmitError);

    $("input#email").val('');
  });

  // initialize jquery gallery in detail modal
  $('body').on('shown.bs.modal', '#detail-modal', function () {
    setUpGallery();
  });

  // clear modal from DOM when closed
  $('body').on('hidden.bs.modal', '.modal', function () {
    removeTemplate('.modal');
  });
}

//
// Document Ready
//

$(function () {
  // set event handlers
  handleEvents();

  // get data from JSON feed and wait for promise to be returned
  getListingData(listingPath).then(function (data) {
    // set global listing object to JSON feed data
    listingsObj = new ListingData();

    listingsObj.setData(data.feed.entry);

    // get template and render
    getTemplate('js/templates/listings.hbs').then(function (template) {
      replaceTemplate('#listings', template, listingsObj.data);
    }).fail(function (err) {
      return console.log('listing template is not available');
    });
  }).fail(function (err) {
    return console.log('data feed is not available');
  });
});
//# sourceMappingURL=/Users/pliddy/Documents/dev/betterway/scripts.js.map