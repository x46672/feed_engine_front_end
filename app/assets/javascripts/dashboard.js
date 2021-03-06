// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
// require handlebars
// require ember
// require ember-data

//= require jquery
//= require handlebars
//= require ember
//= require ember-data
//= require ember-pusher.min
//= require md5
//= require moment.min
//= require_self

window.ghCount = 3;
window.ptCount = 4;
window.pwn = function() {
  App.__container__.lookup('store:main').createRecord('GHNotification', {
    "id": window.ghCount,
    "name":"Nathaniel Watts",
    "message":"BOOMSHAKALAKA",
    "email":"simon.taranto@gmail.com",
    "creationDate": Date.now() });
  console.log(window.ghCount);
  window.ghCount++;
};

window.pt = function() {
  App.__container__.lookup('store:main').createRecord('TrackerNotification', {
    "id": window.ptCount,
    "changeType":"create",
    "kind":"story",
    "userName":"Tyler Long",
    "name":"MAKING ME A STORY",
    "initials":"TL",
    "url":"http://www.pivotaltracker.com/story/show/64265964",
    "creationDate": Date.now() });
    window.ptCount++;
};

App = Ember.Application.create({
  PUSHER_OPTS: { key: '3568c8046d9171a5f8ee', connection: {} }
});

App.Router.map(function() {
  // put your routes here
});

App.IndexRoute = Ember.Route.extend({
  setupController: function(controller, model) {
    controller.set('hubNotifications', model.ghNotifications);
    controller.set('trackerNotifications', model.ptNotifications);
    controller.set('climateStats', [{ stat: "current", gpa: "Loading..."}]);
  },
  model: function() {
    return Em.RSVP.hash({
      ghNotifications: this.store.find('GHNotification'),
      ptNotifications: this.store.find('TrackerNotification') // to be changed to user
    });
  }
});

App.IndexController = Ember.ObjectController.extend(EmberPusher.Bindings, {
  hubNotifications: [],
  trackerNotifications: [],
  climateStats: [],
  buildStatus: "...",
  project_id: function() {
    var pieces = window.location.pathname.split('/'),
        project_id = pieces[ pieces.length -1 ];
    return project_id;
  },
  init: function() {
    var pieces = window.location.pathname.split('/'),
        project_id = pieces[ pieces.length -1 ];
    this.PUSHER_SUBSCRIPTIONS['project_' + project_id] = [
      'github_notification', 
      'tracker_notification', 
      'climate_notification',
      'travis_notification'];
    this._super();
  },
  PUSHER_SUBSCRIPTIONS: {
    activity_channel: ['new_idea'],
    github_notification: ['new_notification']
  },
  updateClimate: function(data) {
    console.log(data);
    this.set('climateStats', data);
  },
  updateTravis: function(data) {
    console.log(data);
    var travis = $('.travis'); 
    var travisClass = data.status;
    console.log(data.status);
    $(travis).removeClass('failing').removeClass('passing').addClass(travisClass);
    this.set('buildStatus', data.status);
  },
  createHubNotification: function(data) {
    console.log(data);
    data.tinyHash = data.tiny_hash;
    data.repoName = data.repo_name;
    data.creationDate = data.creation_date;
    var ghNoNotificationsNotice = $('.github.no-notifications');
    var that = this;
    if (ghNoNotificationsNotice.length > 0) {
      $(ghNoNotificationsNotice).fadeOut(400, function() {
        that.store.createRecord('GHNotification', data);
      });
    } else {
      that.store.createRecord('GHNotification', data);
    }
  },
  createTrackerNotification: function(data) {
    console.log(data);
    data.creationDate = data.creation_date;
    data.changeType = data.change_type;
    data.storyId = data.story_id;
    data.url = data.story_url;
    data.initials = data.user_initials;
    data.userName = data.user_name;
    data.name = data.story_title;
    var ptNoNotificationsNotice = $('.tracker.no-notifications');
    var that = this;
    if (ptNoNotificationsNotice.length > 0) {
      $(ptNoNotificationsNotice).fadeOut(400, function() {
        that.store.createRecord('TrackerNotification', data);
      });
    } else {
      that.store.createRecord('TrackerNotification', data);
    }

  },
  sortedHubNotifications: Ember.computed.sort('hubNotifications', function(a, b) {
    var firstId = parseInt(a.id, 10),
        secondId = parseInt(b.id, 10);
    if (a && b ) {
      if (firstId > secondId) {
        return -1;
      }
      if (firstId < secondId) {
        return 1;
      }
      return 0;
    }
  }),
  sortedTrackerNotifications: Ember.computed.sort('trackerNotifications', function(a, b) {
    var firstId = parseInt(a.id, 10),
        secondId = parseInt(b.id, 10);
    if (a && b ) {
      if (firstId > secondId) {
        return -1;
      }
      if (firstId < secondId) {
        return 1;
      }
      return 0;
    }
  }),
  actions: {
    githubNotification: function(data) { this.createHubNotification(data.data.commit); },
    trackerNotification: function(data) { this.createTrackerNotification(data.data.tracker_event); },
    climateNotification: function(data) { this.updateClimate(data.data); },
    travisNotification: function(data) { this.updateTravis(data.data); }
  },

  notificationsUpdated: function() {
    Ember.run.next(this, function() {
      var flatNotifications = $('.notification.flat');
      var ghNotifications = $('.github-notification');
      var ptNotifications = $('.tracker-notification');
      var ptNoNotificationsNotice = $('.tracker.no-notifications');

      if (flatNotifications) {
        $.each(flatNotifications, function(index, notification) {
          setTimeout(function() {
            $(notification).addClass('full').removeClass('flat')
              .children('.hidden').delay(3000).addClass('visible').removeClass('hidden');
          }, 1);
        });
      }
      if (ghNotifications.length > 12) {
        ghNotifications.last().fadeOut().remove();
      }
      if (ptNotifications.length > 12) {
        ptNotifications.last().fadeOut().remove();
      }
    });
  }.observes('this.hubNotifications.@each', 'this.trackerNotifications.@each')

});

App.UserAvatarComponent = Ember.Component.extend({
  avatarUrl: function() {
    var email = this.get('email').toLowerCase();
        hash = hex_md5(email),
        size = 65;
    return 'http://www.gravatar.com/avatar/' + hash + '?s=' + size;
  }.property('email')
});

App.ApplicationAdapter = DS.FixtureAdapter;

Ember.Handlebars.helper('format-time', function(date) {
  var time = parseInt(date, 10);
  return moment( time ).fromNow();
});

App.TimeStampComponent = Ember.Component.extend({

  startTimer: function () {

    var self = this, currentTime;
    this._timer = setInterval( function () {
      currentTime = parseInt(self.get( 'time' ), 10);
      self.set( 'time', ( currentTime - 60000  ) );
    }, 60000 );

  }.on( 'didInsertElement' ),

  killTimer: function () {
    clearInterval( this._timer );
  }.on( 'willDestroyElement' )

});

App.ClimateChartComponent = Ember.Component.extend({
  tagName: 'svg',
  classNames: 'climate-chart',
  color: ["#2b96ce", "#fff176"],
  didInsertElement: function() {
    this.drawClimate();
  },

  drawClimate: function(){
    var color = this.get('color');
    var width = this.get('width');
    var height = this.get('height');
    var stats = this.get('stats');
    var radius = Math.min(width, height) / 2;
    var gpa = $('.gpa');

    var arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius-2);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.gpa; });

    var id = this.$().attr('id');
    var svg = d3.select("#"+id)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var g = svg.selectAll(".arc")
      .data(pie(stats))
       .enter().append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d, i) { return color[i]; });

    $(gpa).html(stats[0].gpa);

    },
    update: function() {
      //if (this.get('isLoaded')) {
      this.drawClimate();
      //}
    }.observes('stats')
});

App.GHNotification = DS.Model.extend({
  name         : DS.attr(),
  email        : DS.attr(),
  message      : DS.attr(),
  creationDate : DS.attr(),
  tinyHash     : DS.attr(),
  repoName     : DS.attr(),
  elementId: function() {
    return "gh-" + this.get('id');
  }.property('id')
});


App.GHNotification.FIXTURES = [];
//  {
//    id: 1,
//    name: 'Tyler Long',
//    email: 'tyler.stephen.long@gmail.com',
//    message: 'first commit, yo!',
//    tinyHash: '2bn8ic',
//    creationDate: '1390377322000'
//  },
//  {
//    id: 2,
//    name: 'Nathaniel Watts',
//    email: 'reg@nathanielwatts.com',
//    message: 'gotta love the sunshine!',
//    tinyHash: '2bn8ic',
//    creationDate: '1390377708000'
//  }
//];

App.TrackerNotification = DS.Model.extend({
  changeType   : DS.attr(),
  kind         : DS.attr(),
  name         : DS.attr(),
  userName     : DS.attr(),
  initials     : DS.attr(),
  projectId    : DS.attr(),
  projectName  : DS.attr(),
  url          : DS.attr(),
  storyId      : DS.attr(),
  creationDate : DS.attr(),
  displayUrl   : function() {
    return this.get('url').replace('http://www.pivotaltracker.com/', '');
  }.property('url')
});

App.TrackerNotification.FIXTURES = [];
//  {
//    id: 1,
//    changeType: 'create',
//    kind: 'bug',
//    userName: 'Tyler Long',
//    name: 'This is a test story.',
//    initials: 'TL',
//    projectId: '100',
//    storyId: '1380903',
//    projectName: 'The Board of Agility',
//    url: 'http://www.pivotaltracker.com/story/show/64265964',
//    creationDate: '1390377322000'
//  },
//  {
//    id: 2,
//    changeType: 'create',
//    kind: 'story',
//    userName: 'Kevin Powell',
//    name: 'This is a test story.',
//    initials: 'KP',
//    storyId: '1380903',
//    projectId: '100',
//    projectName: 'The Board of Agility',
//    url: 'http://www.pivotaltracker.com/story/show/64265964',
//    creationDate: '1390377322000'
//  },
//  {
//    id: 3,
//    changeType: 'finish',
//    kind: 'chore',
//    userName: 'Simon Taranto',
//    name: 'This is a test story.',
//    initials: 'KP',
//    storyId: '1380903',
//    projectId: '100',
//    projectName: 'The Board of Agility',
//    url: 'http://www.pivotaltracker.com/story/show/64265964',
//    creationDate: '1390377322000'
//  },
//];


