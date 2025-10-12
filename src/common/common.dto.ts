export class AdoptionMailerDto{
    adopterName: string;
    adoptedPetName: string;
    adoptedPetBreed: string;
    adoptedPetAge: string;
    adoptedPetSize: string;
    adoptedPetGender: string;
    adoptedPetImage: string;
    constructor(adopterName:string,adoptedPetName:string,adoptedPetBreed:string,adoptedPetAge:string,adoptedPetSize:string,adoptedPetGender:string,adoptedPetImage:string){
        this.adopterName = adopterName;
        this.adoptedPetName = adoptedPetName;
        this.adoptedPetBreed = adoptedPetBreed;
        this.adoptedPetAge = adoptedPetAge;
        this.adoptedPetSize = adoptedPetSize;
        this.adoptedPetGender = adoptedPetGender;
        this.adoptedPetImage = adoptedPetImage;
    }
}

export interface StatusChangeEmailDto {
    username: string;
    newStatus: string;
    adminName?: string;
}