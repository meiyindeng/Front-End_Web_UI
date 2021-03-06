import { Component, OnInit, ViewChild, Inject} from '@angular/core';
import { Dish } from '../shared/dish';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { visibility, flyInOut, expand } from '../animations/app.animation';





@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ]

})
export class DishdetailComponent implements OnInit {
    
    dish: Dish;
    dishIds: string[];
    prev: string;
    next: string;
    commentForm: FormGroup;
    Comment: Comment;
    @ViewChild('cform') commentFormDirective;
    errMess: string;
    dishcopy: Dish;
    visibility = 'shown';


    formErrors = {
      'comment': '',
      'author': '',
      
  };

  validationMessages = {

    'comment': {
      'required': 'Comment is required'
    },
    'author':{
      'required': 'Author name is required.',
      'minlength': 'Author name must be at least 2 characters long.'
    }   
  };


    constructor(
      private dishService: DishService, 
      private route: ActivatedRoute, 
      private location: Location,
      private commentFormBuilder: FormBuilder,
      @Inject('BaseURL') private baseURL){
        this.createForm();
      }

    ngOnInit() {
      //the dishService return an Observable<idArray>, pipe each id to the corresponding dishId.
      //idArray is the observer object receive notifications from the dishService
      this.dishService.getDishIds().subscribe((idArray) => this.dishIds = idArray, 
        errmess => this.errMess = <any>errmess);

      //make use of the params observable, set this.dish with the return from getDish,
      //set the prev and next from the returnDish.id
      this.route.params
      .pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(params['id']); }))
      .subscribe(receivedDish => { this.dish = receivedDish; this.dishcopy = receivedDish; this.setPrevNext(receivedDish.id); this.visibility='shown';},
        errmess => this.errMess = <any>errmess);
      
    }

    createForm(){
      this.commentForm = this.commentFormBuilder.group({
        rating: 5,
        comment: ['', [Validators.required]],
        author: ['', [Validators.required, Validators.minLength(2)]]
      });
    

      this.commentForm.valueChanges
        .subscribe(data => this.onValueChanged(data));

      this.onValueChanged();  //reset form validation messages

    }

    onValueChanged(data?: any){
      if(!this.commentForm){ return;}
      const form = this.commentForm;
      for (const field in this.formErrors){
        if (this.formErrors.hasOwnProperty(field)){
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          //check if the control is there, if the control is touched, and if the control is not valid
          if (control && control.dirty && !control.valid){
            const message = this.validationMessages[field];
            for (const key in control.errors) {
              if(control.errors.hasOwnProperty(key)){
                this.formErrors[field] += message[key] + ' ';
              }
            }
          }
        }
      }
    }

    onSubmit() {
      this.Comment = this.commentForm.value;
      this.Comment.date = new Date().toISOString();
      console.log(this.Comment);
      //add the comment to the dishcopy object,
      this.dishcopy.comments.push(this.Comment);

      //when there's a modified dish, it's sending the dishcopy, when the server reply back wiih the modified dish,
      //push the dish with the modified dish.
      this.dishService.putDish(this.dishcopy)
        .subscribe(modifiedDish => {
          this.dish = modifiedDish; this.dishcopy = modifiedDish;
        },
        errmess => {this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });

      this.commentForm.reset({
        rating: 5,
        comment: '',
        author: ''
      });
  
    }
  

    setPrevNext(dishId: string) {
      const index = this.dishIds.indexOf(dishId);
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }

    goBack(): void{
      this.location.back();
    }

    

}