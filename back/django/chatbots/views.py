from django.shortcuts import render
from django_pandas.io import read_frame
from .models import SymptomTable, DiseaseTable, SymptomData, NotName
import pandas as pd
from sentence_transformers import SentenceTransformer
from konlpy.tag import Kkma
from .findintent.questions import questions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import SymptomSerializer
from hanspell import spell_checker
from .apps import ChatbotsConfig

# Create your views here.

# @api_view(['GET'])
# def datasave(request):
#     symptomtable = SymptomTable.objects.all()
#     data = read_frame(symptomtable)
#     # model = SentenceTransformer('jhgan/ko-sroberta-multitask')
#     data['embedding'] = pd.Series([[]] * len(data))
#     data['embedding'] = data['indata'].map(lambda x: list(ChatbotsConfig.model.encode(x)))
#     idx = 0
#     for symptom in symptomtable:
#         symptom.embedding = data['embedding'][idx]
#         idx += 1
#         symptom.save()    
#     return
    
@api_view(['GET'])
def index(request):
    pass    
@api_view(['GET'])
def indata(request):
    sentence = request.data['data']
    kkma = Kkma()
    sentences = []
    st = []
    spelled_sent = spell_checker.check(sentence)
    checked_sent = spelled_sent.checked
    flag = 0
    lst = []
    symptomtable = SymptomTable.objects.all()
    data = read_frame(symptomtable)
    notname = NotName.objects.all()
    notnamedata = read_frame(notname)    
    kkma_sentence = kkma.pos(checked_sent)
    for i in range(len(kkma_sentence)):
        print(kkma_sentence[i])
        if flag == 1 and name == 1:
            st.append(kkma_sentence[i][0])
        elif flag == 1 and name == 0:
            st.append(kkma_sentence[i-2][0])
            st.append(kkma_sentence[i][0])
            name = 1
        if kkma_sentence[i][1] == 'JKS':
            flag = 1
            # if kkma_sentence[i-1][0] in lst:
            #     name = 0
            if notnamedata['name'].str.contains(kkma_sentence[i-1][0]).sum() >=1:
                name = 0
            else:
                name = 1
        
        
        if kkma_sentence[i][1] == 'ECE':
            sentences.append(' '.join(st))
            st = []
    sentences.append(' '.join(st))
    answers = []
    print(sentences)
    for sentence in sentences:
        spelled_sent = spell_checker.check(sentence)
        checked_sent = spelled_sent.checked
        if sentence == '':
            continue
        print(checked_sent)
        max_val, question, answer = questions(checked_sent)
        print(max_val, question, answer)
        answers.append(answer)
    lst = []
    dic = dict()
    diseasetable = DiseaseTable.objects.all()
    disease = read_frame(diseasetable)
    for i in answers:
        symptomdata = SymptomData.objects.get(symptom=i)
        a = disease[disease['symptomdata'].str.contains(i)]['ICD']
        b = disease[disease['symptomdata'].str.contains(i)]['diseasename']
        icd = []
        dis = []
        for r in range(len(a)):
            if a.iloc[r] not in icd:
                icd.append(a.iloc[r])
        symptomdata.ICD = icd     
        lst.append(symptomdata)
    serializer = SymptomSerializer(lst, many=True)    
    return Response(serializer.data)

@api_view(['GET'])
def select(request):
    sym = request.data['symptom']
    icd = request.data['icd']
    diseasetable = DiseaseTable.objects.all()
    disease = read_frame(diseasetable)
    data = disease[(disease['ICD']==icd) & (disease['symptomdata'].str.contains(sym))]
    symptomdata = SymptomData.objects.get(symptom=sym)
    lst = []
    disease_name = []
    disease_explane = []
    for i in range(len(data)):
        disease_name.append(data.iloc[i]['diseasename'])
        disease_explane.append(data.iloc[i]['explane'])
    symptomdata.disease = disease_name
    symptomdata.symptomexplane = disease_explane
    
    lst.append(symptomdata)
    serializer = SymptomSerializer(lst, many=True)    


    return Response(serializer.data)