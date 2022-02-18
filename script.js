// DEFINE VISIBILITY MANAGER

var hidden, visibilityChange, browser; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
    hidden = "hidden";
    visibilityChange = "visibilitychange";
}
else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
}
else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

c = navigator.userAgent.search("Chrome");
f = navigator.userAgent.search("Firefox");
m8 = navigator.userAgent.search("MSIE 8.0");
m9 = navigator.userAgent.search("MSIE 9.0");
if ((typeof window.orientation !== "undefined") ||
    (navigator.userAgent.indexOf('IEMobile') !== -1))
    browser = "mobile";
else if (c > -1)
    browser = "Chrome";
else if (f > -1)
    browser = "Firefox";
else if (m9 > -1)
    browser ="MSIE 9.0";
else if (m8 > -1)
    browser ="MSIE 8.0";

console.log(browser);

if (browser == "mobile") d3.select(".chart").style("pointer-events", "none");


// DEFINE SCATTER PLOT

var spherification = 1.1;

// Define scatter plot instance
var scatterPlot = scatterPlot3d()
    .showPoints(true)
    .spherification(spherification).spinPlot(browser != "Firefox")
    .circleColor("rgb(100, 100, 100)")
    .x_max(1).y_max(1).z_max(1);

// Define line plot instance
var lineChartWidth = 0.3;
var linePlot = randomLinePlot()
    .width(lineChartWidth * window.innerWidth)
    .height(window.innerHeight * 0.8);

resizeScatter();

// Get scatter plot data
d3.csv("data/pca_vectors_full.csv", type, function(error, data)
{
    var max_norm = d3.max(
        data,
        function(e) { return Math.sqrt(Math.pow(e['x'], 2) + Math.pow(e['y'], 2) + Math.pow(e['z'], 2)); }
    );
    data = data.map(function(e) {
        var out = {};
        Object.assign(out, e);
        out['x'] = out['x'] / max_norm;
        out['y'] = out['y'] / max_norm;
        out['z'] = out['z'] / max_norm;
        return out
    });

    d3.select('.chart').call(scatterPlot.data(data));

    var dual_drag = d3.drag().on("drag", drag).on("start", dragStart).on("end", dragEnd);

    d3.selectAll('.chart').call(dual_drag);
});

function type(d) {
    d.x = +d.x;
    d.y = +d.y;
    d.z = +d.z;
    return d
}

// Define drag and zoom behaviour for scatter plot
function dragStart() { scatterPlot.dragStart(); }
function drag() { scatterPlot.drag(); }
function dragEnd() { scatterPlot.dragEnd(); }


// DEFINE LINE PLOTS

d3.select('.lineChart').call(linePlot);


// DEFINE NAVIGATION

// Define adjacency matrix
var path_adj = {
        '0_0': ['0_1', '0_0'],
        '0_1': ['0_1', '0_0'],
        '1_0': ['1_1', '0_1'],
        '1_1': ['1_2', '1_0'],
        '1_2': ['1_3', '1_1'],
        '1_3': ['1_4', '1_2'],
        '1_4': ['1_4', '1_3'],
        '2_0': ['2_1', '0_1'],
        '2_1': ['2_2', '2_0'],
        '2_2': ['2_2', '2_1'],
        '3_0': ['0_1', '0_1'],
    };

var navDots = d3.selectAll("li[id*='nav']");

var current_scroll = '0_0',
    current_direction = 0,
    doc_last_scroll = 0,
    doc_current_scroll = 0,
    current_element,
    current_element_name,
    current_time,
    last_time = new Date(),
    timer = 201,
    is_scrolling;
    
window.onscroll = scrollDiscretizer;

function scrollDiscretizer() {
    doc_current_scroll = window.pageYOffset;
    if (!is_scrolling)
        if      (doc_current_scroll > doc_last_scroll) current_direction = 1;
        else if (doc_current_scroll < doc_last_scroll) current_direction = -1;
        else return;

    current_element = document.getElementById(`trigger${current_scroll}`);
    if (current_element)
        controller.scrollTo(current_element);
    
    if (!is_scrolling)
    {
        if      (current_direction > 0) new_scroll = path_adj[current_scroll][0];
        else if (current_direction < 0) new_scroll = path_adj[current_scroll][1];
        else    new_scroll = current_scroll;

        set_id = `nav${new_scroll}`
        navHandler();
        
        is_scrolling = setTimeout(function() {
            is_scrolling = undefined;
        }, 600);
    }
}

window.onbeforeunload = function(){
    window.onscroll = undefined;
    controller.destroy();
    window.scrollTo(0,0);
}

var set_id, new_path, current_path;
function navHandler(d, i) {
    window.onscroll = undefined;

    new_scroll = (this.id || set_id).substr(3, 6);
    new_path = new_scroll.substr(0, 1);
    current_path = current_scroll.substr(0, 1);

    if (current_path != '0' && new_path != '0' && current_path != new_path) new_scroll = '0_1';

    current_element = document.getElementById(`trigger${new_scroll}`);
    if (current_element)
    {
        activatePath(new_scroll, current_scroll);
        current_scroll = new_scroll;
        navDots.classed("active", false);
        controller.scrollTo(current_element);
        d3.select(`#nav${current_scroll}`).classed("active", true);
        doc_last_scroll = window.pageYOffset;
        current_direction = 0;
    }

    window.onscroll = scrollDiscretizer;
    return;
}

navDots.on("click", navHandler);

d3.select(".selectEmbedding").on("click", function() {
        var selection_tl = new TimelineMax()
            .to('#selectEmbedding', 1, {opacity: 1}, 'start')
            .to(['#banner', '#stories', '#selectEncoding', '#selectResources'], 1,
                {
                    opacity: 0,
                    onComplete: function() {
                        set_id = 'nav1_0';
                        navHandler();
                    }
                }, 'start')
            .to(['#banner', '#stories', '#selectEncoding', '#selectResources'], 1, {opacity: 1, delay: 2}, 'end');
        }
    );

d3.select(".selectResources").on("click", function() {
        var selection_tl = new TimelineMax()
            .to('#selectResources', 1, 
                {
                    opacity: 1,
                    onStart: function() {
                        set_id = 'nav3_0';
                        navHandler();
                    }
                }, 'start'
            );
        }
    );

d3.select(".selectEncoding").on("click", function() {
        var selection_tl = new TimelineMax()
            .to('#selectEncoding', 1, {opacity: 1}, 'start')
            .to(['#banner', '#stories', '#selectEmbedding', '#selectResources'], 1,
                {
                    opacity: 0,
                    onComplete: function() {
                        set_id = 'nav2_0';
                        navHandler();
                    }
                }, 'start')
            .to(['#banner', '#stories', '#selectEmbedding', '#selectResources'], 1, {opacity: 1, delay: 2}, 'end');
        }
    );

d3.selectAll(".menuReturn").on("click", function() {
    set_id = 'nav0_1';
    navHandler();
})

d3.select(".mobileWarning").on("click", function() {
    var removeWarning = new TimelineMax().to("#mobileWarning", 1, {left: "100%"});
    mobile_warning.destroy();
})


// DEFINE SCROLL BEHAVIOUR

function activatePath(new_scroll, old_scroll)
{
    if (new_scroll.substr(0, 1) == old_scroll.substr(0, 1)) return;

    destroyPath(old_scroll.substr(0,1));
    createPath(new_scroll.substr(0,1));
}

function createPath(id)
{
    if (id == '0') return;
    d3.selectAll(`div[id*='trigger${id}']`).style('top', function(d, i) { return `calc(100% + ${20000 + i * 10000}px)`; });
}

function destroyPath(id) 
{
    if (id == '0') return;
    d3.selectAll(`div[id*='trigger${id}']`).style('top', '100000px');
}

// Scroll controller
var controller = new ScrollMagic.Controller();

TweenLite.onOverwrite = function(overwritten, overwriting) {
    console.log("tween that was overwritten");
    console.log(overwritten);
    
    console.log("tween that did the overwriting")
    console.log(overwriting);
}
TweenLite.defaultOverwrite = false;

// ENTRY PATH (0)

// SCENE 0_0

var scene_0_0 = new TimelineMax()
    .to('#loadingLogo', 1, {opacity: 1, delay: 0.5, ease: Power0.easeNone}, 'start')
    .to('#rs_path', 5, {strokeDashoffset: '-1000px', ease: Power0.easeNone}, 'start')
    .to('#loadingLogo', 1, {opacity: 0, delay: 4}, 'start')
    .to('#title', 0.75, {left: '10%', opacity: 0.75, delay: 6, ease: Power1.easeOut}, 'start');


// SCENE 0_1

if (browser == "mobile")
{
    var mobile_warning = new ScrollMagic.Scene({triggerElement: "#trigger0_1"})
        .setTween("#mobileWarning", 1, {left: "5%"})
        .addTo(controller);
}

var scene_0_1_tl = new TimelineMax()
    .to("#title", 1, {left: '30%', opacity: 0}, 'start')
    .fromTo("#bannerContainer", 1, {top: '120%'}, {top: '10%'}, 'start')
    .to('#indicator', 1, {right: '16px'}, 'start')
    .to("#scroll-downs", 1, {opacity: 0}, 'start');

var scene_0_1 = new ScrollMagic.Scene({triggerElement: "#trigger0_1"})
    .setTween(scene_0_1_tl)
    .on('start', function(e) { if (e.scrollDirection === "FORWARD") scene_0_0.progress(1); })
    .addTo(controller);


// EMBEDDING PATH (1)

chart = d3.select(".chart");

// SCENE 1_0

var namesToShow = [
    'WINWORD.EXE',
    'EXCEL.EXE',
    'docker-compose.exe',
    'docker.exe',
    'git.exe',
    'SourceTree.exe',
    'git-credential-manager.exe',
    'chrome.exe',
    'GoogleUpdate.exe',
    'MicrosoftEdgeCP.exe',
    'python.exe',
    'conda.exe',
    'OneDrive.exe',
    'googledrivesync.exe',
    'sh.exe',
    'powershell.exe',
    'bash.exe'
];

var scene_1_0_tl = new TimelineMax()
    .fromTo("#bannerContainer", 1, {opacity: 0.75}, {opacity: 0}, 'start')
    .fromTo("#embeddingIntro", 1, {left: '-40%', opacity: 0}, {left: '0%', opacity: 1, ease: Power0.easeNone,
        onReverseComplete: function() {
            TweenMax.to("#chart", 0.2, {left: "15%", borderLeftWidth: "0vw", backgroundColor: "rgba(245, 245, 245, 1)"});
        }
    }, 'start')
    .to("#scroll-downs", 1, {opacity: 1}, 'start');

var scene_1_0 = new ScrollMagic.Scene({triggerElement: "#trigger1_0"})
    .setTween(scene_1_0_tl)
    .on("start", function(e) 
    {
        if (e.scrollDirection === "FORWARD")
        {
            TweenLite.to("#chart", 1, {left: '30%', ease: Power0.easeNone});
            TweenLite.to("#bannerContainer", 0.01, {delay: 1, top: '100%'});
            scatterPlot.showNames(namesToShow);
            scatterPlot.spherification(1, 1000);
        }
        else
        {
            TweenLite.to("#chart", 1, {left: '15%', ease: Power0.easeNone});
            TweenLite.to("#bannerContainer", 0.01, {top: '10%'});
            scatterPlot.showNames([]);
            scatterPlot.spherification(spherification, 1000);
        }
    })
    .addTo(controller);

// SCENE 1_1

var scene_1_1_tl = new TimelineMax()
    .to("#embeddingIntro", 0.5, {opacity: 0}, 'start')
    .fromTo("#embeddingText", 1, {left: '-40%', opacity: 0}, {left: '0%', opacity: 1, ease: Power0.easeNone}, 'start');

var scene_1_1 = new ScrollMagic.Scene({triggerElement: "#trigger1_1"})
    .setTween(scene_1_1_tl)
    .on("start", function(e) 
    {
        if (e.scrollDirection === "FORWARD")
            TweenLite.to("#chart", 1, {borderLeftWidth: '0.1vw', ease: Power0.easeNone});
        else
            TweenLite.to("#chart", 1, {borderLeftWidth: '0vw', ease: Power0.easeNone});
    })
    .addTo(controller);

// SCENE 1_2

var scene_1_2_tl = new TimelineMax()
    .to("#semiCircleText", 0.3, {backgroundColor: 'rgba(62,135,207, 0)'}, 'start')
    .to("#embedTrainText", 1, {left: '70%'}, 'start');

var scene_1_2 = new ScrollMagic.Scene({triggerElement: "#trigger1_2"})
    .setTween(scene_1_2_tl)
    .on("start", function(e) 
    {
        if (e.scrollDirection === "FORWARD")
        {
            TweenLite
                .to("#chart", 1, {
                    left: '0%', borderLeftWidth: '0vw', backgroundColor: 'rgba(245, 245, 245, 0)'
                });
            TweenLite.to("#embeddingText", 1, {left: '-40%'});
            scatterPlot.colColumn("class", 0);
            timeout_h = scatterPlot.randomizeData();
        }
        else
        {
            TweenLite
                .to("#chart", 1, {
                    left: '30%', borderLeftWidth: '0.1vw', backgroundColor: 'rgba(245, 245, 245, 1)',
                    ease: Power1.easeIn
                });
            TweenLite.to("#embeddingText", 1, {left: '0%', ease: Power1.easeIn});
            scatterPlot.colColumn(null, 0);
            scatterPlot.spinPlot(browser != "Firefox").spherification(1, 1000);
        }
    })
    .addTo(controller);

// SCENE 1_2

var logHeight = document.getElementById("logStream").scrollHeight / window.innerHeight * 100,
    errorScore = {score: 0.69310},
    errorElem = document.getElementById('error');

var scene_1_2_exit_tl = new TimelineMax()
    .to("#embedTrainText", 0.5, {opacity: 0}, 'start')

var scene_1_2_exit = new ScrollMagic.Scene({triggerElement: "#trigger1_3"})
    .setTween(scene_1_2_exit_tl)
    .addTo(controller);

var scene_1_3_tl = new TimelineMax()
    .to("#logStream", 8, {top: `-${logHeight-95}%`}, 'start')
    .to("#error", 8, {color: 'green', ease: Power1.easeOut}, 'start')
    .to(
        errorScore, 8, 
        {
            score: "-=0.44321",
            onUpdate: function() { errorElem.innerHTML = 'Error: ' + errorScore.score.toFixed(5); },
            overwrite: false,
            ease: Power3.easeOut
        },
        'start'
    );

var scene_1_3 = new ScrollMagic.Scene({triggerElement: "#trigger1_3"})
    .setTween(scene_1_3_tl)
    .on("start", function(e) {
        if (e.scrollDirection === "FORWARD")
            scatterPlot.animateTrain();
        else
        {
            scatterPlot.colColumn("class", 0);
            scatterPlot.spinPlot(browser != "Firefox").spherification(1, 1000);
        }

        scene_1_3_tl.progress(0); errorElem.innerHTML = '';
    })
    .addTo(controller);

// SCENE 1_4

var scene_1_4_tl = new TimelineMax()
    .to("#conclusion", 1, {opacity: 1}, 'start')
    .to("#scroll-downs", 1, {opacity: 0}, 'start');

var scene_1_4 = new ScrollMagic.Scene({triggerElement: "#trigger1_4"})
    .setTween(scene_1_4_tl)
    .on("start", function(e) {
        if (e.scrollDirection === "FORWARD")
        {
            scatterPlot.spinPlot(browser != "Firefox").spherification(1, 100);
        }
    })
    .addTo(controller);


// ENCODING PATH (2)

// SCENE 2_0

var scene_2_0_tl = new TimelineMax()
    .to('#encodingContainer', 1, {left: '0%', ease: Power0.easeNone}, 'start')
    .to("#bannerContainer", 1, {opacity: 0}, 'start')
    .to("#bannerContainer", 0.1, {top: '100%'}, 'end')
    .to("#chart", 1, {left: '-85%', ease: Power0.easeNone}, 'start')
    .to("#scroll-downs", 1, {opacity: 1}, 'start');

var scene_2_0 = new ScrollMagic.Scene({triggerElement: "#trigger2_0"})
    .setTween(scene_2_0_tl)
    .on('start', function(e) {
        if (e.scrollDirection === "FORWARD")
        {
            scatterPlot.spinPlot(false);
            linePlot.playAnimation(true);
        }
        else
        {
            scatterPlot.spinPlot(browser != "Firefox");
            linePlot.playAnimation(false);
        }
    })
    .addTo(controller);

// SCENE 2_1

var scene_2_1_tl = new TimelineMax()
    .to("#lineChart", 1, {left: "10%", ease: Power0.easeNone}, 'start')
    .to("#encodingSideText_1", 0.5, {opacity: 0, ease: Power0.easeNone}, 'start')
    .to("#encodingSideText_2", 0.5, {opacity: 1, ease: Power0.easeNone, delay: 0.5}, 'start');

var scene_2_1 = new ScrollMagic.Scene({triggerElement: "#trigger2_1"})
    .setTween(scene_2_1_tl)
    .on('start', function(e) {
        if (e.scrollDirection === "FORWARD")
        {
            lineChartWidth = 0.3;
            linePlot.showElements(1, 1, 1).width(lineChartWidth * window.innerWidth);
        }
        else
        {
            lineChartWidth = 0.3;
            linePlot.showElements(1, 0, 0).width(lineChartWidth * window.innerWidth);
        }
    })
    .addTo(controller);

// SCENE 2_2

var scene_2_2_tl = new TimelineMax()
    .to("#scroll-downs", 1, {opacity: 0}, 'start')
    .to("#encodingSideText_2", 0.5, {opacity: 0, ease: Power0.easeNone}, 'start')
    .to("#encodingSideText_3", 0.5, {opacity: 1, ease: Power0.easeNone, delay: 0.5}, 'start');

var scene_2_2 = new ScrollMagic.Scene({triggerElement: "#trigger2_2"})
    .setTween(scene_2_2_tl)
    .addTo(controller);


// RESOURCES PATH (3)

// SCENE 3_0

var scene_3_0_tl = new TimelineMax()
    .to("#imageDragger", 1, {top: '55%'}, 'start')
    .to("#bannerContainer", 1, {top: '0%'}, 'start')
    .to(["#stories", "#stories-list"], 1, {opacity: 0}, 'start')
    .to(["#stories", "#stories-list"], 0.1, {width: '0%'}, 'end')
    .to("#scroll-downs", 1, {opacity: 1}, 'start');

var scene_3_0 = new ScrollMagic.Scene({triggerElement: "#trigger3_0"})
    .setTween(scene_3_0_tl)
    .addTo(controller);


// RESIZE HANDLER

window.onresize = resizeScatter;
var wh, is_resizing;
function resizeScatter() {
    window.clearInterval(is_resizing);

    if (controller)
    {
        window.onscroll = undefined;
        is_resizing = setTimeout(
            function() { 
                current_element = document.getElementById(`trigger${current_scroll}`);
                if (current_element)
                {
                    controller.scrollTo(current_element);
                }
                window.onscroll = scrollDiscretizer;
            }, 1000
        );
    }

    wh = Math.max(window.innerWidth, window.innerHeight) * 0.7;
    scatterPlot.width(wh).height(wh);
    linePlot.width(lineChartWidth * window.innerWidth).height(window.innerHeight * 0.8);
}
