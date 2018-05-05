import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatInput } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  public result: { network: string, subnetMask: string, range: string, useableIPs: number };

  public subnetInputValue = "255.255.255.0";
  public ipAddressInputValue = "192.168.1.1";

  subnets: number[];
  slashes: number[];

  @ViewChild('subnetInput') subnetInput: ElementRef;

  constructor() {
    this.result = { network: '', subnetMask: '', range: '', useableIPs: 0 }
    this.subnets = [255, 254, 252, 248, 240, 224, 192, 128, 0];
    this.slashes = [32, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  }

  ngOnInit() {
    this.updateNetwork();
  }

  addressKeyEvent(value: any) {
    if (value.key == '/') this.focusSubnet();
    this.ipAddressInputValue = this.ipAddressInputValue.replace('/', '');
  }

  focusSubnet() {
    this.subnetInput.nativeElement.focus();
    this.subnetInput.nativeElement.select();
  }

  updateNetwork() {
    this.calculateSubnetInfo();
  }

  private validateIPAddress(ip): number[] | null {
    let ipSplit = ip.split('.');
    let ipSplitNum: number[] = [];
    if (ipSplit.length != 4) return null;
    for (let ip of ipSplit) {
      if (parseInt(ip) < 0 || parseInt(ip) > 255) return null; //out of range
      ipSplitNum.push(parseInt(ip)); //change the type to an integer.
    }
    return ipSplitNum;
  }

  private calculateSubnetInfo() {
    let ipSplit = this.validateIPAddress(this.ipAddressInputValue);
    if (!ipSplit) return;
    const slash = this.getSubnetSlash();
    const base = Math.floor(slash / 8) + 1;
    const mask = base + 1;
    const rem = slash % 8;
    const split = Math.pow(2, rem);
    const block = 256 / split;
    const baseIP = ipSplit[base-1];
    let blockStart = baseIP - (baseIP % block);
    let blockEnd = blockStart + block - 1;
    if (base == 4) {
     // blockStart++;
      blockEnd--;
    }
    this.result.useableIPs = Math.pow(2, (32 - slash)) - 2;

    let fix = "";
    let zeros = "";
    let ends = "";
    for (let i = 0; i < base-1; i++) {
      fix += ipSplit[i];
      if (i < 3) fix += ".";
    }

    

    if (slash == 32) {
      this.result.range = `${fix} - ${fix}`;
    } else {
      for (let i = base + 1; i <= 4; i++) {
        zeros += '.';
        ends += '.';
        if (i == 4) {
          zeros += "0";
          ends += "254";
        } else {
          zeros += "0";
          ends += "255";
        }
      }

      console.log(`base = ${base}  fix = ${fix}   blockstart = ${blockStart}  zeros = ${zeros}`);


      this.result.range = `${fix}${blockStart}${zeros} -  ${fix}${blockEnd}${ends}`;
      if (base == 4) {
        this.result.network = `${fix}${blockStart} / ${slash}`;
      } else {
        this.result.network = `${fix}${blockStart}.0 / ${slash}`;
      }
      
      this.result.subnetMask = this.slashToDotNet(slash);
    }
  }

  private getSubnetSlash(): number | null {
    let slash: number;

    if (parseInt(this.subnetInputValue) > 0 && parseInt(this.subnetInputValue) < 33) return parseInt(this.subnetInputValue);

    let subnetSplit = this.validateIPAddress(this.subnetInputValue);
    if (!subnetSplit) return null;
    return this.dotNetToSlash(this.subnetInputValue);
    
//need to convert . notation to /
    
  }

  private slashToDotNet(slash:number):string {
    let base:number = Math.floor(slash / 8);
    let rem:number = slash % 8;
    let mask: string = "";
    if (rem > 0)
      mask = ""+(256 - Math.pow(2, (8 - rem)));
    else
      mask = "0";
    for (var i = 1; i <= base; i++) {
      mask = "255." + mask;
    }
    base++;
    for (var i = base + 1; i <= 4; i++) {
      mask = mask + ".0";
    }
    
    return mask;

  }

  private validateDotNet(subnetSplit: number[]) {
    let base:number = -1;
    let mask: number;
    for (let i = 0; i < 4; i++) {
      if (base == -1 && subnetSplit[i] != 255) {
        mask = subnetSplit[i];
        base = i;
      }else if (base>=0 && subnetSplit[i] != 255) {
        subnetSplit[i] = 0;
      }
    }
    if (!this.subnets.includes(mask)) subnetSplit[base] = 255;
    return subnetSplit;
  }


  private dotNetToSlash(dotNet: string): number {
    let slash: number;
    let subnetSplit: number[] = this.validateIPAddress(dotNet);
    subnetSplit = this.validateDotNet(subnetSplit);
    this.subnetInputValue = subnetSplit.join('.');
    let base: number = -1;
    let mask: number;
    console.log(subnetSplit);
    for (let i = 0; i < 4; i++) {
      if (base==-1 && subnetSplit[i] != 255) {
        mask = subnetSplit[i];
        base = i;
      }
    }
    

    slash = base * 8;
    console.log(`select mask ${mask} for i = ${base} gives us a / ${slash}`);
    if (slash < 32) {
      mask = 256 - mask;
      slash = slash + (8 - this.getBaseLog(2, mask));
    }
    
    return slash;

  }

  private getBaseLog(x:number, y:number):number {
  //log of y with the base x; where x will be 2 here
  return Math.log(y) / Math.log(x);
}

}
