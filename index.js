const url = "https://cfw-takehome.developers.workers.dev/api/variants"
const code = 301
const OLD_URL = "https://cloudflare.com"
const NEW_URL = "https://github.com/nddq"


// function from one of the template on the documents
class AttributeRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
      element.setAttribute(
        this.attributeName,
        attribute.replace(OLD_URL, NEW_URL),
      )
      element.setInnerContent("Go to my Github")
    }
    else {
      element.append(" (tampered)") 
    }
  }
}

// html rewriter to modify the element of the variants
const rewriter = new HTMLRewriter()
  .on('title', new AttributeRewriter(''))
  .on('h1#title', new AttributeRewriter(''))
  .on('p#description', new AttributeRewriter(''))
  .on('a#url', new AttributeRewriter('href'))


addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  let variants;

  await fetch(url)
    .then(response => {
      return response.json()
    })
    .then(data => {
      variants = data.variants; // extract the array of URLS
    })

  const NAME = 'intern-app'
  const cookie = request.headers.get('cookie')

  //fetch each variant
  const VARIANT_1 = await fetch(variants[0])
  const VARIANT_2 = await fetch(variants[1])

  // used cookie to persist which variant the user would see based on the the first time they visit the site
  if (cookie && cookie.includes(`${NAME}=VARIANT_1`)) {
    return rewriter.transform(VARIANT_1) 
  } else if (cookie && cookie.includes(`${NAME}=VARIANT_2`)) {
    return rewriter.transform(VARIANT_2)
  } else {
    let group = Math.random() < 0.5 ? 'VARIANT_1' : 'VARIANT_2' // return each variant roughly 50% of the time
    let r = group === 'VARIANT_1' ? VARIANT_1 : VARIANT_2
    r = rewriter.transform(r)
    r.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)
    return r
  }
}



