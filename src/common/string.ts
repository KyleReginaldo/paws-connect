import { AdoptionMailerDto } from "./common.dto";

export function adoptionMailerBody(dto: AdoptionMailerDto): string{
    const{adoptedPetAge,adoptedPetBreed,adoptedPetGender,adoptedPetName,adoptedPetSize,adopterName,adoptedPetImage} = dto;
     return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tester</title>
    <style>
      * {
        font-family: 'Courier New', Courier, monospace !important;
      }
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 20px !important;
        background-color: #f5f5f5 !important;
        text-align: center !important;
      }
      .container {
        background-color: rgb(27, 27, 27) !important;
        width: 400px !important;
        margin: 0 auto !important;
        padding: 16px 10px !important;
        border-radius: 8px 8px 0 0 !important;
        text-align: center !important;
      }
      .container p {
        color: white !important;
        margin-bottom: 8px !important;
        text-align: center !important;
        font-size: 15px !important;
      }
      .details {
        background-color: aliceblue !important;
        width: 400px !important;
        margin: 0 auto !important;
        padding: 10px !important;
      }
      .details p,
      .details h5,
      .details h4 {
        margin: 4px 0 !important;
        font-size: 13px !important;
      }
      .details h4 {
        color: rgb(50, 50, 50) !important;
      }
      .details h5 {
        margin-bottom: 10px !important;
        color: rgb(255, 92, 33) !important;
      }
      .details a {
        text-decoration: none !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 13px !important;
      }
      .footer {
        width: 400px !important;
        margin: 0 auto !important;
        padding: 10px !important;
        background-color: rgb(27, 27, 27) !important;
        color: white !important;
        border-radius: 0 0 8px 8px !important;
      }
      .footer p,
      .footer a {
        margin: 0 !important;
        padding: 0 !important;
        margin-bottom: 4px !important;
        font-size: 13px !important;
        color: white !important;
      }
      .footer a {
        text-decoration: none !important;
        color: white !important;
      }
      .logo {
        border-radius: 8px !important;
      }
      ul {
        margin: 0 !important;
        padding-left: 20px !important;
      }
      li {
        font-size: 12px !important;
        color: orangered !important;
        margin-bottom: 4px !important;
      }
      .facebook {
        background-color: rgb(56, 56, 255) !important;
        width: 32px !important;
        height: 32px !important;
        margin: 0 auto !important;
        border-radius: 4px !important;
        text-align: center !important;
        line-height: 32px !important;
      }
      .pet-image {
        height: 100px !important;
        width: 100px !important;
        border-radius: 8px !important;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div style="text-align: center; margin-bottom: 15px;">
        <img src="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/files/playstore.png" alt="PawsConnect Logo" height="60" class="logo" style=""/>
      </div>
      <p>Congratulations ${adopterName}!🎉</p>
      <p>You have been approved for adoption ${adoptedPetName}(${adoptedPetBreed})</p>
      <img src="${adoptedPetImage}" alt="${adoptedPetName}" class="pet-image" />
    </div>
    <div class="details">
      <h4>Details</h4>
      <p>Name: ${adoptedPetName}</p>
      <p>Breed: ${adoptedPetBreed}</p>
      <p>Age: ${adoptedPetAge}</p>
      <p>Size: ${adoptedPetSize}</p>
      <p>Gender: ${adoptedPetGender}</p>
      <h4>Please note that:</h4>
      <ul>
        <li>Up to 3 days before the adoption expires.</li>
        <li>Please bring a suitable cage of the correct size for your adopted pet.</li>
      </ul>
    </div>
    <div class="footer">
      <p>You can contact us using:</p>
      <p>Phone: +639923189664</p>
      <p>Email: pawsconnecttof@gmail.com</p>
    </div>
  </body>
</html>
`;
}