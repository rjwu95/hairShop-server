// 패키지 및 디비 연결
let puppeteer = require('puppeteer');
let mongoose = require('mongoose');
let { Schema } = require('mongoose');
const { mongodbHost, mapApiKey } = require('./config/mongoose.json');
const axios = require('axios');

mongoose.connect(mongodbHost, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log('we are connected!');
});

const shopSchema = new Schema({
  name: String,
  address: [String],
  category: String,
  rating: Number,
  menu: Object,
  review: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  image: [String],
  contact: String,
  homepage: String,
  openingHours: [String],
  location: Object,
  tags: [String],
});

//compile our schema into a model
var shop = mongoose.model('Shop', shopSchema);

/* crawaling */

// 크롤링 실행
urlScrap();

async function urlScrap() {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  for (let j = 1; j <= 50; j++) {
    console.log('page :', j);
    try {
      await page.goto(
        `https://store.naver.com/hairshops/list?page=${j}&query=%EB%AF%B8%EC%9A%A9%EC%8B%A4`,
      );
      try {
        await page.waitFor('li.list_item');
      } catch (err) {
        console.log(err);
        await page.goto(
          `https://store.naver.com/hairshops/list?page=${j}&query=%EB%AF%B8%EC%9A%A9%EC%8B%A4`,
        );
      }
      let hairShopList = await page.$$('li.list_item');
      for (let shop of hairShopList) {
        //take url from each hairShop list
        await page.waitFor(1000);

        let url = await shop.$eval('a', el => el.href.match(/.*entry=pll/)[0]);
        await hairShopScrap(url);
      }
    } catch (err) {
      console.log(err);
    }
  }
  await page.close();
  console.log('매무리');
  await browser.close();
}
//////////////////////////////////////////
const priceScrap = async url => {
  let menu = {};
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  try {
    await page.goto(url);
    await page.waitForSelector('div.list_txt_menu_area', { timeout: 5000 });
    let priceLists = await page.$$('div.list_txt_menu_area');

    for (let list of priceLists) {
      let category = await list.$eval('strong.category', el => el.innerText);
      let items = await list.$$eval('li.list_item', lists => {
        return lists.map(el => ({
          name: el.childNodes[0].childNodes[1].innerText,
          price: el.childNodes[0].childNodes[0].innerText,
        }));
      });
      menu[category] = items;
    }
  } catch (err) {
    console.log(err);
  }
  await page.close();
  await browser.close();
  return menu;
};

async function imageScrap(url) {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  let images = [];

  try {
    await page.goto(url);
    await page.waitForSelector('div.list_photo', { timeout: 5000 });
    let imageWrapper = await page.$('div.list_photo');
    let imageFrames = await imageWrapper.$$eval('div.thumb', frames =>
      frames.map(el => el.childNodes[0].src),
    );
    for (let i = 0; i < 5 && i < imageFrames.length; i++) {
      images.push(imageFrames[i]);
    }
    await page.close();
    await browser.close();
    return images;
  } catch (err) {
    console.log(err);
  }
}

async function hairShopScrap(url) {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  console.log('샵 스크랩 시작');
  let category, hairShopName;
  let contact = '';
  let homepage = '';
  let location = {};
  let address = [];
  let imageUrls = [];
  let menu = [];
  let openingHours = [];

  /* Restaurant Name */
  try {
    await page.goto(url);
    await page.waitForSelector('div.biz_name_area', { timeout: 5000 });
    let title = await page.$('div.biz_name_area');
    hairShopName = await title.$eval('strong.name', function(el) {
      return el.innerText;
    });
    category = '미용실';
  } catch (err) {
    console.log(err);
  }

  /* address */
  try {
    await page.waitForSelector('div.list_bizinfo', { timeout: 5000 });
    let info = await page.$('div.list_bizinfo');

    const temp = await info.$eval('div.txt', div => div.innerText);
    const matchedNotNumberAndDash = temp.match(/(?=[^0-9])(?=[^-])/)
    if (!matchedNotNumberAndDash) contact = temp
    homepage = await info.$eval('a.biz_url', a => a.href);
    openingHours = await info.$$eval('span.time', times =>
      times.map(el => el.innerText),
    );

    address = await info.$$eval('span.addr', el => {
      let temp = el.map(element => element.innerText);
      return temp;
    });
    const defineAddress =
      address[0]
        .split(' ')
        .join('+')
        .trim() || null;
    if (defineAddress) {
      const locationResult = await axios.get(
        encodeURI(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${defineAddress}&key=${mapApiKey}`,
        ),
      );
      location = locationResult.data.results[0].geometry.location;
    }
  } catch (err) {
    console.log(err);
  }

  try {
    await page.waitForSelector('div.place_tab_area', { timeout: 5000 });
    let tabArea = await page.$('div.place_tab_area');
    const tabs = await tabArea.$$eval('a.tab', async tabs => {
      return tabs.map(el => el.attributes['aria-label'].value);
    });
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i] === '가격') {
        menu = await priceScrap(url + '&tab=price');
      } else if (tabs[i] === '사진요약') {
        imageUrls = await imageScrap(url + '&tab=photo');
      }
    }
  } catch (err) {
    console.log(err);
  }

  /* Save to the database */
  shop.find({ name: hairShopName }, (err, data) => {
    if (err) console.log(err);
    if (data.length === 0) {
      shop.create({
        name: hairShopName,
        address,
        category,
        menu,
        image: imageUrls,
        contact,
        homepage,
        openingHours,
        location,
      });
    }
    console.log('들어감!', hairShopName);
  });
  // shop.updateOne(
  //   { name: hairShopName },
  //   {
  //     name: hairShopName,
  //     address,
  //     category,
  //     menu,
  //     image: imageUrls,
  //     contact,
  //     homepage,
  //     openingHours,
  //     location,
  //   },
  //   (err, data) => {
  //     if (err) console.log(err);
  //     console.log('들어감!', hairShopName);
  //   },
  // );

  await page.close();
  await browser.close();
  return;
}
