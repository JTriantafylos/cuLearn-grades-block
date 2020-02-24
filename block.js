
function getUrlParams(url) {
    let params = {};
    url.substring(1).replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function (str, key, value) {
            params[key] = value;
        });
    return params;
}

function clearTable() {
    // clear the table before updating it
    let table = document.getElementById('GradesTable');
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
}

function refreshTable() {
    clearTable();
    // read the current set semester (default is most recent one)
    let semester = document.getElementById('semesters').value;
    let links = $(`.category_label:contains("${semester}")`).next().children();

    let requests = [];
    let classurl = 'https://culearn.carleton.ca/moodle/course/view.php?id=';

    // create ajax requests for each class in the semester provided
    for (let x = 0; x < links.length; x++) {
        links[x] = getUrlParams($(links[x]).find("a")[0].href);
        requests.push($.ajax({
            url: "https://culearn.carleton.ca/moodle/grade/report/user/index.php?id=" + links[x]['id'],
            success: function (data) {
                // filter out classes (if you are a TA/instructor) and MS-LAP
                if ($(data).find("div#graded_users_selector").length == 0 && !$(data).find('h1')[0].innerHTML.includes('MS-LAP')) {

                    let org = $(data).find("th.level1:first")[0].innerHTML;

                    let linked = `<a href=${classurl + links[x].id}>${org}</a>`;


                    let fullTable = $(data).find("tbody:first")[0].innerHTML.replace(org, linked);

                    // remove feedback
                    let remove = $(fullTable).find(".column-feedback");

                    for (let x = 0; x < remove.length; x++) {
                        fullTable = fullTable.replace(remove[x].innerHTML, "");
                    }
                    // add to the table
                    document.getElementById("GradesTable").innerHTML += "<table>" + fullTable + "</table><div style = \"width:100%; border-bottom: 1px solid black;\"></div>";
                }
            }
        })
        );
    }
}

function init() {
    // get the DOM elements ready
    let app = document.createElement('div');
    app.id = 'GradesApp';

    let table = document.createElement('div');
    table.id = 'GradesTable';

    document.getElementById('GradesScript').parentElement.append(app);

    let semesters = Array.from(document.getElementsByClassName('category_label')).filter(
        item => ['W', 'S', 'F'].includes(item.innerHTML.charAt(0)));

    let select = document.createElement('select');
    select.id = 'semesters';

    app.append(select, table);

    for (let x = 0; x < semesters.length; x++) {
        let option = document.createElement('option');
        option.id = x;
        option.innerHTML = $(semesters[x]).html();

        select.append(option);

    }
    refreshTable();
    select.addEventListener('change', refreshTable);
}

function isReady() {
    if (window.jQuery) {
        init();
    } else {
        setTimeout(() => { isReady() }, 50);
    }
}

isReady();