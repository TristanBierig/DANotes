import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Note } from '../interfaces/note.interface';

@Injectable({
  providedIn: 'root',
})
export class NoteListService {
  firestore: Firestore = inject(Firestore);

  normalNotes: Note[] = [];
  trashNotes: Note[] = [];

  unsubNotes;
  unsubTrash;

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubTrash = this.subTrashList();
  }

  ngOnDestroy() {
    this.unsubNotes();
    this.unsubTrash();
  }

  async deleteNote(colId: 'notes' | 'trash', docId: string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch((err) => {
      console.error(err);
    });
  }

  async addNote(note: Note, colId: 'notes' | 'trash') {
    if (colId == 'notes') {
      await addDoc(this.getNotesRef(), note)
        .catch((err) => {
          console.error(err);
        })
        .then((docRef) => {
          console.log('Document created with ID: ', docRef?.id);
        });
    } else {
      await addDoc(this.getTrashRef(), note)
        .catch((err) => {
          console.error(err);
        })
        .then((docRef) => {
          console.log('Document moved to Trash with ID: ', docRef?.id);
        });
    }
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch((err) => {
        console.error(err);
      });
    }
  }

  getCleanJson(note: Note): {} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    };
  }

  getColIdFromNote(note: Note): string {
    if (note.type == 'note') {
      return 'notes';
    } else {
      return 'trash';
    }
  }

  subNotesList() {
    return onSnapshot(this.getNotesRef(), (list) => {
      this.normalNotes = [];
      list.forEach((element) => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach((element) => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || 'note',
      title: obj.title || '',
      content: obj.content || '',
      marked: obj.marked || false,
    };
  }
}
