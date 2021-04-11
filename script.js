const pup = require('puppeteer');
let id = 'delhi_covid19'; // TEMP MAIL: janaga9729@684hh.com
let pass = 'random@1999';

let whatsAppData = [];
let coronaDashboardData = [];
let myGovtData = [];
let browser;

async function main() {
    browser = await pup.launch({headless: false, defaultViewport: false, args: ['--start-maximized']});
    let pagesArr = await browser.pages();
    let tab = pagesArr[0];
    await tab.goto('https://twitter.com/login'); 

    await tab.waitForSelector('input[name="session[username_or_email]"]', {visible: true});
    await tab.type('input[name="session[username_or_email]"]', id);

    await tab.waitForSelector('input[name="session[password]"]', {visible: true});
    await tab.type('input[name="session[password]"]', pass);

    await wait(2000);
    await tab.click('div[data-testid="LoginForm_Login_Button"]');

    await fetchDataFromWhatsApp('https://web.whatsapp.com/', await browser.newPage());

    for(let i = 0; i < whatsAppData.length; i++) 
    {
        let ob = whatsAppData[i];
        let heading = ob.title;
        let desc = ob.description;
        
        let tweet = heading + '\n 🚨     ⚠     🦠' + desc;

        await postTweet(tab, tweet);

        await wait(1000);
    }

    await wait(2000);

    await fetchDataFromCoronaDashboard('http://corona.delhi.gov.in/', await browser.newPage());

    let tweet1 = 'Available ICU Beds with Ventilators  🛏\n';
    for(let i = 0; i < availableBeds.length; i++) 
    {
        let ob = coronaDashboardData[i];

        let str = `${i+1}. ${ob.name}     ${ob.vacant}/${ob.total}    📞${ob.contact}`;
        tweet1 += str + '\n';
    }

    await postTweet(tab, tweet1);

    await wait(2500);

    await fetchDataFromMyGov('https://www.mohfw.gov.in/', await browser.newPage());

    let tweet2 = myGovtData[0] + myGovtData[1];
    await postTweet(tab, tweet2);
}

main();

async function wait(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}

async function postTweet(tab, tweet) {
    await tab.waitForSelector('.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr', {visible: true});
    await tab.click('.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr');
    await tab.type('.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr', tweet);

    await tab.click('.css-18t94o4.css-1dbjc4n.r-urgr8i.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-1w2pmg.r-19u6a5r.r-ero68b.r-1gg2371.r-1ny4l3l.r-1fneopy.r-o7ynqc.r-6416eg.r-lrvibr');
}

async function fetchDataFromWhatsApp(url, tab) {
    await tab.goto(url);
    await tab.waitForSelector('._2_1wd.copyable-text.selectable-text', {visible: true});
    await tab.click('._2_1wd.copyable-text.selectable-text');
    await tab.type('._2_1wd.copyable-text.selectable-text', 'Team RHA Rohini');
    await tab.waitForSelector('span[title="Team RHA Rohini"]', {visible: true});
    await tab.click('span[title="Team RHA Rohini"]');

    await tab.waitForSelector('._3ExzF', {visible: true});
    await tab.hover('._3ExzF');
    await wait(2000);
    await tab.mouse.wheel({ deltaY: 50 });
    await wait(2000);
    let msgs = await tab.$$('._3ExzF');

    for(let i = 0; i < msgs.length; i++)
    {
        await getMessage(msgs[i], tab);
    }

    await tab.close();
}

async function getMessage(msgElement, tab) {
    let obj = {};

    let desc = await tab.evaluate(function(ele) {
        return ele.textContent;
    }, msgElement);

    let eleHeading = await msgElement.$('strong');
    let heading = await tab.evaluate(function(ele) {
        return ele.innerText;
    }, eleHeading);

    let str = desc.substring(heading.length);
    obj.title = heading;
    obj.description = str;
    whatsAppData.push(obj);
}

async function fetchDataFromCoronaDashboard(url, tab) {
    await tab.goto(url);
    await tab.waitForSelector('.bedVentilator', {visible: true});
    let grids = await tab.$$('.bedVentilator');
    await grids[0].click();

    await wait(2000);
    await tab.close();
    let tabsArr = await browser.pages();
    tab = tabsArr[1];

    await tab.waitForSelector('.card.text-white.bg-success.mb-3.shadow', {visible: true});
    let cards = await tab.$$('.card.text-white.bg-success.mb-3.shadow');
    await cards[1].click();

    await tab.waitForSelector('tr[class="table-success"]', {visible: true});
    let availableBeds = await tab.$$('tr[class="table-success"]');
    
    for(let i = 0; i < availableBeds.length; i++)
    {
        await getAvailableBeds(availableBeds[i], tab);
    }

    await wait(2000);
    await tab.close();
}

async function getAvailableBeds(bed, tab) {
    let obj = {};

    let ele1 = await bed.$('th[class="text-left"]');
    let hospital = await tab.evaluate(function(ele) {
        return ele.textContent;
    }, ele1);

    let ele2 = await ele1.$('span');
    let type = await tab.evaluate(function(ele) {
        return ele.textContent;
    }, ele2);

    hospital = hospital.substring(type.length+3);

    let allColumns = await bed.$$('td');
    let totalBeds = await tab.evaluate(ele => {return ele.textContent}, allColumns[1]);

    let ele3 = await allColumns[2].$('a[data-toggle="collapse"]');
    let vacantBeds = await tab.evaluate(ele => {return ele.textContent}, ele3);

    let ele4 = await allColumns[2].$('a[class="badge badge-pill badge-success"]');
    let contact = await tab.evaluate(ele => {return ele.textContent}, ele4);

    obj.name = hospital;
    obj.total = totalBeds;
    obj.vacant = vacantBeds;
    obj.contact = contact.substring(1);

    coronaDashboardData.push(obj);
}

async function fetchDataFromMyGov(url, tab) {
    await tab.goto(url);

    await tab.waitForSelector('.fullbol', {visible: true});
    let ele1 = await tab.$('.fullbol');
    let totalVaccinated = await tab.evaluate(ele => {return ele.textContent}, ele1);
    totalVaccinated = totalVaccinated.replace(')', '🔝)');

    await tab.waitForSelector('.bg-blue', {visible: true});
    let ele2 = await tab.$('.bg-blue');
    let elements = await ele2.$$('span[class="mob-show"]');
    let activeCases = await tab.evaluate(ele => {return ele.textContent}, elements[2]);
    activeCases = 'Active Cases : \n ' + activeCases;
    activeCases = activeCases.replace(')', '📈)');

    myGovtData.push(totalVaccinated);
    myGovtData.push(activeCases);

    await tab.close();
}
