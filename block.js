let requests = []

function getUrlParams (url) {
  const params = {}
  url.substring(1).replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function (str, key, value) {
      params[key] = value
    })
  return params
}

function clearTable () {
  // Clear the table before updating it
  const table = document.getElementById('GradesTable')
  while (table.firstChild) {
    table.removeChild(table.firstChild)
  }

  // Cancel ongoing requests and clear promises
  requests.forEach(req => req.abort())
  requests = []
}

function refreshTable () {
  document.getElementById('loading').style.display = 'block'
  const linked = []

  clearTable()
  // Read the current set semester (default is most recent one)
  const semester = document.getElementById('semesters').value
  const links = $(`.category_label:contains("${semester}")`).next().children()

  const classurl = 'https://culearn.carleton.ca/moodle/course/view.php?id='

  // Create ajax requests for each class in the semester provided
  for (let x = 0; x < links.length; x++) {
    links[x] = getUrlParams($(links[x]).find('a')[0].href)
    requests.push($.ajax({
      url: 'https://culearn.carleton.ca/moodle/grade/report/user/index.php?id=' + links[x].id
    }))

    linked.push(`<a href=${classurl + links[x].id}>`)
  }

  Promise.all(requests).then((arr) => {
    // Hide loader
    document.getElementById('loading').style.display = 'none'
    arr.forEach((data, index) => {
      // Filter out classes (if you are a TA/instructor) and MS-LAP
      if ($(data).find('div#graded_users_selector').length == 0 && !$(data).find('h1')[0].innerHTML.includes('MS-LAP')) {
        const org = $(data).find('th.level1:first')[0].innerHTML
        const link = `${linked[index]}${org}</a>`
        let fullTable = $(data).find('tbody:first')[0].innerHTML.replace(org, link)

        // Remove feedback
        const remove = $(fullTable).find('.column-feedback')

        for (let x = 0; x < remove.length; x++) {
          fullTable = fullTable.replace(remove[x].innerHTML, '')
        }
        // Add to the table
        document.getElementById('GradesTable').innerHTML += '<table>' + fullTable + '</table><div style = "width:100%; border-bottom: 1px solid black;"></div>'

        // Add some padding to the grade and range td's
        const tds = $('td')
        for (let i = 0; i < tds.length; i++) {
          if (tds[i].headers.includes('grade') || tds[i].headers.includes('range')) {
            tds[i].style.paddingLeft = '16px'
            tds[i].style.paddingRight = '16px'
          }
        }
      }
    })
  }).catch(e => e)
}

function init () {
  // Create loading bar
  const loading = document.createElement('img')
  loading.src = 'https://www.cs.toronto.edu/~amlan/demo/loader.gif'
  loading.id = 'loading'
  loading.alt = 'Loading...'
  loading.height = '50'
  loading.width = '50'
  loading.style.marginLeft = '50%'

  // Get the DOM elements ready
  const app = document.createElement('div')
  app.id = 'GradesApp'

  const table = document.createElement('div')
  table.id = 'GradesTable'

  document.getElementById('GradesScript').parentElement.append(app)

  const semesters = Array.from(document.getElementsByClassName('category_label')).filter(
    item => ['W', 'S', 'F'].includes(item.innerHTML.charAt(0)))

  const select = document.createElement('select')
  select.id = 'semesters'
  select.addEventListener('change', refreshTable)

  const hide = document.createElement('span')
  hide.id = 'hide_unmarked'

  const hideLabel = document.createElement('input')
  hideLabel.id = 'hide_unmarked_label'
  hideLabel.textContent = 'Hide Unmarked: '

  const hideCheckbox = document.createElement('input')
  hideCheckbox.id = 'hide_unmarked_checkbox'
  hideCheckbox.type = 'checkbox'
  hideCheckbox.addEventListener('change', refreshTable)

  hide.append(hideLabel, hideCheckbox)

  app.append(select, hide, table, loading)

  for (let x = 0; x < semesters.length; x++) {
    const option = document.createElement('option')
    option.id = x
    option.innerHTML = $(semesters[x]).html()
    select.append(option)
  }

  refreshTable()
}

function isReady () {
  if (window.jQuery) {
    init()
  } else {
    setTimeout(() => { isReady() }, 50)
  }
}

isReady()
