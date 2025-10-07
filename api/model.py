import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv('exoplanets_2025.csv', skiprows=53)

df['ExoplanetCandidate'] = df['koi_pdisposition'].apply(lambda x: 1 if x == 'CANDIDATE' else 0)
df['ExoplanetConfirmed'] = df['koi_disposition'].apply(lambda x: 2 if x == 'CONFIRMED' else 1 if x == 'CANDIDATE' else 0 )

df.drop(columns=[
    'kepler_name','kepoi_name','koi_teq_err1','kepid','koi_disposition','koi_pdisposition',
    'koi_fpflag_nt','koi_fpflag_ss','koi_fpflag_co','koi_fpflag_ec','koi_tce_delivname',
    'koi_teq_err2', 'koi_kepmag', 'koi_srad', 'koi_score'
], inplace=True)

def clean_data(df):
    assert isinstance(df, pd.DataFrame), "df needs to be a pd.DataFrame"
    df.dropna(inplace=True)
    indices_to_keep = ~df.isin([np.nan, np.inf, -np.inf]).any(axis=1)
    return df[indices_to_keep].astype(np.float64)

df = clean_data(df)

features = df.drop(columns=['ExoplanetCandidate','ExoplanetConfirmed'])
target = df.ExoplanetCandidate

X_train, X_test, y_train, y_test = train_test_split(features, target, random_state=1, test_size=.40)

forest = RandomForestClassifier(n_estimators=100, criterion='gini')
forest.fit(X_train, y_train)
y_pred = forest.predict(X_test)

joblib.dump(forest, 'model-r.joblib')
