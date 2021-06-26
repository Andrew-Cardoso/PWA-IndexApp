const ID = 'experience';

export default class Experience {
    constructor ( experience ) {        
        this.id = ID;
        this.current = experience?.current ?? 0;
        this.level = experience?.level ?? 0;
        this.total = experience?.total ?? 32;
    }
}
