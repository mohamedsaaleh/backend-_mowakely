const mongoose = require('mongoose');
require('./src/modules/categories/categories.model');
require('./src/modules/users/users.model');
require('./src/modules/clients/clients.model');
require('./src/modules/lawyers/lawyers.model');
const { Case } = require('./src/modules/cases/cases.model');
const env = require('./src/config/env');

async function testPopulate() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to DB');

  const c1 = await Case.findOne()
    .populate('category', 'name')
    .populate({ path: 'client', select: 'user', populate: { path: 'user', select: 'full_name profile_photo' } })
    .populate({ path: 'lawyer', select: 'rate', populate: { path: 'user', select: 'full_name' } });
  
  console.log('WITH select user (NO LEAN) JSON stringified:');
  console.log(JSON.stringify(c1.client, null, 2));

  const c2 = await Case.findOne()
    .populate('category', 'name')
    .populate({ path: 'client', select: 'user full_name profile_photo', populate: { path: 'user', select: 'full_name profile_photo' } });

  console.log('WITH select user full_name (NO LEAN):');
  console.log(JSON.stringify(c2.client, null, 2));

  mongoose.disconnect();
}
testPopulate();
