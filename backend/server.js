require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const supabase = require("./src/config/supabase");

async function testConnection() {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase Error:", error.message);
  } else {
    console.log("Supabase Connected Successfully");
  }
}

testConnection();
