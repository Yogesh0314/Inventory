const { connectDB, getModels } = require('./config/db');
require('dotenv').config();

const promoteUser = async () => {
  await connectDB();
  const models = getModels();
  
  const email = 'admin@smartstock.com';
  
  try {
    const user = await models.User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log(`Current role for ${email}: ${user.role}`);
    
    const updatedUser = await models.User.findByIdAndUpdate(user._id, { role: 'admin' }, { new: true });
    console.log(`✅ User ${email} promoted to: ${updatedUser.role}`);
    
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error promoting user: ${err.message}`);
    process.exit(1);
  }
};

promoteUser();
